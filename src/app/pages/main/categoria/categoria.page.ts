import { Component, OnInit, inject } from '@angular/core';
import { CategoriaComponent } from 'src/app/shared/components/categoria/categoria.component';
import { Categoria } from 'src/app/models/categoria.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { orderBy, where } from 'firebase/firestore';



@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.page.html',
  styleUrls: ['./categoria.page.scss'],
})

export class CategoriaPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  categorias: Categoria[] = [];
  loading: boolean = false;

  ngOnInit() {
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getCategorias();
  }
  //Reiniciar pagina
  doRefresh(event) {
    
    setTimeout(() => {
     this.getCategorias(),
      event.target.complete();
    }, 1000);
  }

  //Orden de categorias
  getCategorias() {
   // let path = `usuarios/${this.user().uid}/categorias`;
   let path = `categorias`;

    this.loading = true;

    let query = [
      orderBy('nombre', 'desc') //Aqui ordeno las categorias por nombre
      //Orden de categorias
    ]

    let sub = this.firebaseSvc.getCollectionData(path, query).subscribe({
      next: (res: any) => {
        console.log(res);
        this.categorias = res;

        this.loading = false;

        sub.unsubscribe();
      }
    })

  }

  // Agregar o actualizar producto  
  async addUpdateCategoria(categoria?: Categoria) {

    let success = await this.utilsSvc.presentModal({
      component: CategoriaComponent,
      cssClass: 'add-update-modal',
      componentProps: { categoria }
    })

    if(success) this.getCategorias();
    }


async confirmDeleteCategoria(categoria: Categoria) {
   this.utilsSvc.presentAlert({
    header: 'Borrar Categoria',
    message: 'Esta seguro de borrar la categoria? Esta accion es inremediable!',
    mode: 'ios',
    buttons: [
      {
        text: 'Cancelar',
      }, {
        text: 'Borrar',
        handler: () => {
          this.deleteCategoria(categoria)
        }
      }
    ]
  });

}


//Eliminar producto
async deleteCategoria(categoria: Categoria){


 // let path = `usuarios/${this.user().uid}/categorias/${categoria.id}`;
 let path = `categorias/${categoria.id}` 

  const loading = await this.utilsSvc.loading();
  await loading.present();


  
  
  this.firebaseSvc.deleteDocument(path).then(async res => {

  this.categorias = this.categorias.filter(p => p.id != categoria.id ); 

    this.utilsSvc.presentToast({ 
      message: 'Categoria eliminada exitosamente',
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

  

}
