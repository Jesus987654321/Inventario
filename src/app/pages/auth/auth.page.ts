import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;


@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  
  pdfObj = null;
  constructor () {}


  pdf() {
    const docDef = {

      pageSize: 'A4',
      pageOrientation: 'portrait',

      pageMargins: [ 10, 10, 10, 10 ],

      content: [
        {
          table:{
            body: [

                ['imprima hp']

            ]
          }
        }
      ]


    }
    this.pdfObj = pdfMake.createPdf(docDef);

    this.pdfObj.download('nojoda.pdf');
  }

  form = new FormGroup({

    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])

        //Campos del formulario login
    
  })

firebaseSvc = inject(FirebaseService);
utilsSvc = inject(UtilsService)

  ngOnInit() {
  }

 async submit(){
  if (this.form.valid) {

    const loading = await this.utilsSvc.loading();
    await loading.present();

    this.firebaseSvc.signIn(this.form.value as User).then(res => {


    this.getUserInfo(res.user.uid);

    }).catch(error => {
      console.log(error);


    this.utilsSvc.presentToast({ 
      //message: error.message,
      message: 'Usuario inexistente o datos invalidos',
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
      //Codigo de error 
    })


    }).finally(() => {
      loading.dismiss();
    })
  }
}

async getUserInfo(uid: string){
  if (this.form.valid) {

    const loading = await this.utilsSvc.loading();
    await loading.present();

   // let path = `usuarios/${uid}` //Esta es la coleccion
     let path = `usuarios_global/${uid}`;
    delete this.form.value.password;

    this.firebaseSvc.getDocument(path).then((user: User) => {

    this.utilsSvc.saveInLocalStorage('user', user);
    //--------------------------Aqui redirecciono al home-------------//
    this.utilsSvc.routerLink('/main/home');
    this.form.reset();

    this.utilsSvc.presentToast({ 
      message: `Bienvenido`,
      duration: 1500,
      color: 'success',
      position: 'middle',
      icon: 'person-circle-outline'
    })

    
    
    }).catch(error => {
      console.log(error);


    this.utilsSvc.presentToast({ 
      message: error.message,
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    })

   //Codigo de error 

    }).finally(() => {
      loading.dismiss();
    })
  }
}


}
