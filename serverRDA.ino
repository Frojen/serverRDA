#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include "FS.h"

MDNSResponder mdns;

#ifndef STASSID
#define STASSID "onlime298"
#define STAPSK  "hss298297"
#endif

const char* ssid = STASSID;
const char* password = STAPSK;
String answer;
ESP8266WebServer server(80);

String webPage = "";
String jsPage = "";
uint16_t result;

void setup() {
  Serial.begin(9600);
  Serial.println("Booting");
  
  startWiFi();
  
  Serial.println("Ready");
  Serial.print("IP:");
  Serial.println(WiFi.localIP());

  if(!SPIFFS.begin()){
    Serial.println("Error SPIFFS");
    return;
  }
  File file = SPIFFS.open("/index.html", "r");
  if(!file){
    Serial.println("index error");
    return;
  }

  while(file.available()){
    webPage = webPage + (char)file.read();
  }
  file.close();
  Serial.println("Web File - OK");

  file = SPIFFS.open("/js/app.js", "r");
  if(!file){
    Serial.println("js error");
    return;
  }

  while(file.available()){
    jsPage = jsPage + (char)file.read();
  }
  file.close();
  Serial.println("JS File - OK");  

  if (mdns.begin("esp8266", WiFi.localIP())) {
    Serial.println("MDNS started");
  }

  server.on("/js/app.js", [](){
    server.send(200, "application/javascript", jsPage);
    delay(1000);
  });
  
  server.on("/", [](){
    server.send(200, "text/html", webPage);
    delay(1000);
  });

  server.on("/setRegisters", [](){
    if ((server.method() == HTTP_POST) & (server.argName(0) == "registers")) {
      
      int indexLastArguments = server.args()-1;
      int indexArguments = 1;
      int isSettingNotError = true;
      while (indexArguments < indexLastArguments) {
        if (!(setRegister(server.argName(indexArguments), server.arg(indexArguments), server.arg(indexArguments+1)))) {
          isSettingNotError = false;
          break;
        }
        indexArguments++;
        indexArguments++;
      }
      
      if (isSettingNotError) {
        server.send(200, "text/plain", "OK");
      } else {
        server.send(400, "text/plain", "Error");
      }
    } else {
      server.send(400, "text/plain", "Error");
    }
  });
  
    server.on("/getRegisters", [](){
    if ((server.method() == HTTP_POST) & (server.argName(0) == "registers")) {

      int indexLastArguments = server.args()-1;
      int indexArguments = 1;
      answer="";
      int isGettingNotError = true;
      if (getRegister(server.arg(indexArguments))) {
        answer += server.argName(indexArguments) + "=" + String(result, DEC);
      } else {
        isGettingNotError = false;
      }
      indexArguments++;
      while ((indexArguments < indexLastArguments) && (isGettingNotError)) {
        if (!(getRegister(server.arg(indexArguments)))) {
          isGettingNotError = false;
          break;
        }
        answer += ", " + server.argName(indexArguments) + "=" + String(result, DEC);
        indexArguments++;
      }
      if (isGettingNotError) {
        server.send(200, "text/plain", answer);
      } else {
        server.send(400, "text/plain", "Error");
      }
    } else if ((server.method() == HTTP_POST) & (server.argName(0) == "RDS")){
        if (getRDS()) {
          server.send(200, "text/plain", answer);
        } else {
          server.send(400, "text/plain", "Error");
        }
    } else {
      server.send(400, "text/plain", "Error");
    }
  });
  
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP started");
}

void loop() {
  checkOTA();
  server.handleClient();
}

boolean setRegister(String reg, String command, String mask){
  uint8_t regSend;
  uint8_t h;
  uint8_t l;
  char temp[1];
  
  if (getRegister(reg)) {
    result &= mask.toInt();
    result |= command.toInt();
    regSend = lowByte(reg.toInt());
    h = highByte(result);
    l = lowByte(result);
    Serial.write(254);
    Serial.write(regSend);
    Serial.write(h);
    Serial.write(l);
    Serial.write(regSend&h|l);
    if (Serial.readBytes(temp, 1) == 1) {
      if (temp[0] == (regSend & h | l)){
        return true;
      }
    }
  }
  return false;
}

boolean getRegister(String reg){
  char temp[3];
  uint8_t regSend;

  regSend = lowByte(reg.toInt());
  
  Serial.write(255);
  Serial.write(regSend);
  Serial.write(!regSend);

  if (Serial.readBytes(temp, 3) == 3) {
    if ((temp[0] | temp[1]) == temp[2]) {
      result = temp[0];
      result = result << 8;
      result |= temp[1];
      return true;
    }
  }
  return false;
}

unsigned long RDSPeriod = 0;

boolean getRDS(){
  char temp[8];
  Serial.write(253);
  Serial.write(85);
  Serial.write(170);
  answer = "";
  RDSPeriod=millis();
  while (millis()-RDSPeriod > 2500){
    Serial.readBytes(temp, 8)
    if ((temp[0]==temp[1]) and (temp[1]==temp[2]) and (temp[2]==temp[3]) and (temp[3]==170)){
      return true;
    }
    result = temp[0];
    result = result << 8;
    result |= temp[1];
    answer += String(result, DEC)+",";
    result = temp[2];
    result = result << 8;
    result |= temp[3];    
    answer += String(result, DEC)+",";
    result = temp[4];
    result = result << 8;
    result |= temp[5];  
    answer += String(result, DEC)+",";
    result = temp[6];
    result = result << 8;
    result |= temp[7];  
    answer += String(result, DEC)+";";
  }
  return false;
}

void setFreq(String value){
  uint16_t command;
  
  Serial.write(254);
  Serial.write(2);
  Serial.write(194);
  Serial.write(1);  

  command = (uint16_t) value.toDouble()*10;
  command = (command - 870) << 6;
  command = command | 0x0010;
  Serial.write(254);
  Serial.write(3);
  Serial.write(highByte(command));
  Serial.write(lowByte(command));    
}

void startWiFi(){
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("Fail...");
    Serial.println("Reboot...");
    delay(5000);
    ESP.restart();
  } 
  startOTA();
}

void startOTA() {
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else { // U_FS
      type = "filesystem";
    }

    // NOTE: if updating FS this would be the place to unmount FS using FS.end()
    Serial.println("Start updating " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
//  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
//    Serial.println("Progress: " + (progress / (total / 100)));
//  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.println("Error: " + error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });
  ArduinoOTA.begin();  
}

void checkOTA(){
  ArduinoOTA.handle();  
}

void handleNotFound() {
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}
