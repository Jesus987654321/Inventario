import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder, } from '@angular/forms';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})


export class AddUpdateProductComponent implements OnInit {

  
  form = new FormGroup({
    id: new FormControl(''),
    image: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    precio: new FormControl(null, [Validators.required, Validators.min(1)]),
    Cantidad: new FormControl(null, [Validators.required, Validators.min(0)]),        
  });
  
  @Input() product: Product;
  loading: boolean = false;
  user = {} as User;
  products: Product[] = []; 
  

  code: any;

  constructor(

    private firebaseSvc: FirebaseService, 
    private utilsSvc: UtilsService,

  ) {}

  

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    
    // Si hay un producto, inicializa el formulario con sus datos
    if (this.product) {
      this.form.patchValue({
        id: this.product.id,
        image: this.product.image,
        name: this.product.name,
        precio: this.product.precio,
        Cantidad: this.product.Cantidad,
      });
    }
  }




  //----------------------Tomar/Seleccionar imagen-------------------//
  async takeImage() {
    const dataUrl = (await this.utilsSvc.takePicture('Imagen del producto')).dataUrl;
    this.form.controls.image.setValue(dataUrl);
  }

  submit() {
    if (this.form.valid) {
      
      if (this.product) {
          this.updateProduct();
      } else {
          this.createProduct();
      }
        
    }
  }

  setNumberInputs() {
    let { Cantidad, precio} = this.form.controls;
    if (Cantidad.value) Cantidad.setValue(parseFloat(Cantidad.value));
    if (precio.value) precio.setValue(parseFloat(precio.value));
   
  }

 

  //Crear producto
  
async createProduct() {
  let path = `productos`;
  const nombreProducto = this.form.get('name').value;
  const NombreExistente = await this.firebaseSvc.getDocumentByField(path, 'name', nombreProducto);

  if (NombreExistente) {
    this.utilsSvc.presentToast({
      message: 'Ya existe un producto con este nombre',
      duration: 1500,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
  } else {
    // Cargando
    const loading = await this.utilsSvc.loading();
    await loading.present();

    // Subir la imagen y obtener la URL
    let dataUrl = this.form.value.image;
    let imagePath = `${this.user.uid}/${Date.now()}`;
   // let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
   // this.form.controls.image.setValue(imageUrl);


    this.firebaseSvc.addDocument(path, this.form.value).then(async res => {
      this.utilsSvc.presentToast({
        message: 'Producto creado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      // Cerrar el modal solo si el producto se registra con éxito
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

  //Editar producto
  async updateProduct() {
  //  let path = `usuarios/${this.user.uid}/productos/${this.product.id}`;
  let path = `productos/${this.product.id}`;
    const nombreProducto = this.form.get('name').value;
    const ProductoExistente = await this.firebaseSvc.getDocumentByField('productos', 'name', nombreProducto);
  
    if (ProductoExistente && ProductoExistente['id'] !== this.product.id) {
      this.utilsSvc.presentToast({
        message: 'Ya existe un producto con este nombre',
        duration: 1500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }
 
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    // Subir la imagen nueva y obtener la URL
    if (this.form.value.image !== this.product.image) {
      let dataUrl = this.form.value.image;
      let imagePath = await this.firebaseSvc.getFilePath(this.product.image);
    //  let imageUrl = await this.firebaseSvc.uploadImage(imagePath, dataUrl);
    //  this.form.controls.image.setValue(imageUrl);
    }
  
    delete this.form.value.id;
  
    this.firebaseSvc.updateDocument(path, this.form.value).then(async res => {
      this.utilsSvc.dismissModal({ success: true });
      this.utilsSvc.presentToast({
        message: 'Producto actualizado exitosamente',
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

 
}