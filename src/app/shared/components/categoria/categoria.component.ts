import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Categoria } from 'src/app/models/categoria.model';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';


@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.scss'],
})
export class CategoriaComponent  implements OnInit {

 
  @Input() categoria: Categoria

  products: Product[] = [];
  
  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(4), this.onlyLettersValidator]),
  });
  

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  
  user = {} as User;
  
    ngOnInit() {
      this.user = this.utilsSvc.getFromLocalStorage('user');
      if (this.categoria) this.form.setValue(this.categoria);
    }
  
  
    submit () {
      if (this.form.valid) {
        if(this.categoria) this.updateCategoria();
        else this.createCategoria()
      }
    }
    onlyLettersValidator(control: FormControl) {
      const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
      if (!control.value.match(regex)) {
        return { onlyLetters: true };
      }
      return null;
    }
  
  
  //Crear Categoria
  // Crear categoría
async createCategoria() {
  let path = `categorias`;
  const nombreCategoria = this.form.get('nombre').value;
  const categoriaExistente = await this.firebaseSvc.getDocumentByField(path, 'nombre', nombreCategoria);

  if (categoriaExistente) {
    this.utilsSvc.presentToast({
      message: 'Ya existe una categoría con este nombre',
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
    return;
  }

  const loading = await this.utilsSvc.loading();
  await loading.present();

  this.firebaseSvc.addDocument(path, this.form.value).then(async res => {
    this.utilsSvc.presentToast({
      message: 'Categoría creada exitosamente',
      duration: 1500,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });

    // Cerrar el modal solo si la categoría se crea con éxito
    this.utilsSvc.dismissModal({ success: true });
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

// Actualizar categoría
async updateCategoria() {
  let path = `categorias/${this.categoria.id}`;
  const loading = await this.utilsSvc.loading();
  await loading.present();
  const nombreCategoria = this.form.get('nombre').value;
  const categoriaExistente = await this.firebaseSvc.getDocumentByField('categorias', 'nombre', nombreCategoria);

  if (categoriaExistente && categoriaExistente['id'] !== this.categoria.id) {
    this.utilsSvc.presentToast({
      message: 'Ya existe una categoría con este nombre',
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
    loading.dismiss();
    return;
  }

  this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
    this.utilsSvc.presentToast({
      message: 'Categoría actualizada exitosamente',
      duration: 1500,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });

    // Cerrar el modal solo si la categoría se actualiza con éxito
    this.utilsSvc.dismissModal({ success: true });
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

}
