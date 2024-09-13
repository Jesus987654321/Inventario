import { Component, OnInit, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import { CondicionesComponent } from 'src/app/shared/components/condiciones/condiciones.component';
import { PerfilComponent } from 'src/app/shared/components/perfil/perfil.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  form = new FormGroup({
    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    passwordConfirmation: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  ngOnInit() {
    this.populateForm();
  }

  populateForm() {
    const user = this.user();
    this.form.patchValue({
      uid: user.uid,
      email: user.email,
      password: user.password,
      name: user.name
    });
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  async takeImage() {
    // Código para actualizar la imagen del perfil
  }

  async updateUser() {
    const user = this.user();
    const path = `usuarios/${user.uid}`;

    const updatedUser: User = {
      ...user,
      email: this.form.value.email,
      password: this.form.value.password,
      name: this.form.value.name
    };

    await this.firebaseSvc.updateDocument(path, updatedUser);
    this.utilsSvc.saveInLocalStorage('user', updatedUser);
    this.utilsSvc.presentToast({ 
      message: 'Usuario actualizado exitosamente',
      duration: 1500,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
  }

  Condiciones() {
    this.utilsSvc.presentModal({
      component: CondicionesComponent,
      componentProps: {
        title: 'Condiciones'
      }
    });
  }

  Perfil() {
    this.utilsSvc.presentModal({
      component: PerfilComponent,
      componentProps: {
        title: 'Perfil'
      }
    });
  }
}





import { Component, Input, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import { CondicionesComponent } from 'src/app/shared/components/condiciones/condiciones.component';
import { PerfilComponent } from 'src/app/shared/components/perfil/perfil.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  form = new FormGroup({

    uid: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    confirmpassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])

        //Campos del formulario login
    
  })

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  @Input() user: User
 
  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (this.user) {
        const { uid, email, name, password } = this.user;
        const formValue = { uid, email, name, password, confirmpassword: '' };
        this.form.setValue(formValue);
    }
}
  
  submit () {
    if (this.form.valid) {
      if(this.user) this.updateCategoria();
    }
  }

  async updateCategoria() {
    let path = `usuarios/${this.user.uid}`;
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
      this.utilsSvc.dismissModal({ success: true });
      this.utilsSvc.presentToast({
        message: 'Categoría actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    }).catch(error => {
      console.log(error);
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }).finally(() => {
      loading.dismiss();
    });
  }
 

   async takeImage() {

    let user = this.user;

    let path = `usuarios/${user.uid}`; //Esta es la coleccion

    

    const dataUrl = (await this.utilsSvc.takePicture('Imagen de Perfil')).dataUrl;

    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    let imagePath = `${user.uid}/profile`;
    user.image = await this.firebaseSvc.uploadImage(imagePath, dataUrl);

    this.firebaseSvc.updateDocument(path, {image: user.image }).then(async res => {

       this.utilsSvc.saveInLocalStorage('user', user);
  
  
        this.utilsSvc.presentToast({ 
          message: 'Imagen actualizada exitosamente',
          duration: 1500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        })
        //Codigo de error 
  
       
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

  Condiciones(){
    this.utilsSvc.presentModal({
      component: CondicionesComponent,
      componentProps: {
        title: 'Condiciones'
      }
    })
  }

  Perfil(){
    this.utilsSvc.presentModal({
      component: PerfilComponent,
      componentProps: {
        title: 'Condiciones'
      }
    })
  }

}
