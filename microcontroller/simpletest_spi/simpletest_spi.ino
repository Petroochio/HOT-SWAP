/***************************************************
Simple example of reading the MCP3008 analog input channels and printing
them all out.

Author: Carter Nelson
License: Public Domain
****************************************************/

#include <Adafruit_MCP3008.h>

Adafruit_MCP3008 adc1;
//Adafruit_MCP3008 adc2;

int count = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  Serial.println("MCP3008 simple test.");


  adc1.begin(13, 11, 12, 10); //arguments: sck, mosi, miso, cs
  //adc2.begin(13, 11, 12, 9);
 
}

void loop() {
  for (int chan=0; chan<8; chan++) {
    Serial.print(adc1.readADC(chan));
    if (chan == 3) Serial.print(":");
    else if (chan != 7) Serial.print(" ");
  }
  
//  for (int chan=0; chan<8; chan++) {
//    Serial.print(adc2.readADC(chan)); Serial.print("\t");
//  }
  Serial.print("-");
//  Serial.println();
  count++;
  
  delay(10);
}
