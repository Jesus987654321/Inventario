import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

//          Firebase

import { AngularFireModule } from '@angular/fire/compat'; 
import { environment } from 'src/environments/environment';

//Escanner


import { FileOpener } from '@ionic-native/file-opener/ngx';
import { File } from '@ionic-native/file/ngx';
import { PDFGenerator } from '@ionic-native/pdf-generator/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot({mode: 'md'}), 
  AppRoutingModule, 
  AngularFireModule.initializeApp(environment.firebaseConfig)
],
  providers: [ 
    AndroidPermissions,
File,
FileOpener,
PDFGenerator,
    {
     provide: 
     RouteReuseStrategy, 
     useClass: 
     IonicRouteStrategy ,

    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
