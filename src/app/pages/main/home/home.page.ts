import { Component, NgModule, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import { orderBy, where } from 'firebase/firestore';
import { HistorialService } from 'src/app/services/historial.service';
//import jsPDF from 'jspdf';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { FileOpener } from '@ionic-native/file-opener/ngx';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})


export class HomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  products: Product[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  pdfObject: any;
  constructor(
    private historialService: HistorialService,
    public file:File,
    public fileOpener:FileOpener,
    public platform: Platform
  ) {}

 

  pdf() { 
    let docDefinition = { 
        content: [], 
        header: { 
            margin: [0, 10, 0, 0], 
            text: [ 
                { text: 'INVENTARIO DEL ABASTO LA PERLA DE ORIENTE', alignment: 'center' }, 
            ] 
        }, 
        footer: function(currentPage, pageCount) { 
            return [ 
                { 
                    text: 'Copyright © jesusmedina0921@gmail.com. Todos los derechos reservados.\n', 
                    alignment: 'center' 
                }, 
                { 
                    text: `Página ${currentPage} de ${pageCount}`, 
                    alignment: 'center' 
                } 
            ]; 
        }, 
        styles: { 
            header: { 
                fontSize: 14, 
                bold: true, 
                margin: [0, 10, 0, 10], 
                color: 'white', 
                alignment: 'center' 
            }, 
            tableHeader: { 
                bold: true, 
                fontSize: 12, 
                color: 'white', 
                fillColor: '#0054e9', // Cambiado a azul #0054e9 
                alignment: 'center' 
            }, 
            tableExample: { 
                margin: [0, 5, 0, 15] 
            } 
        }, 
    }; 
    const maxProductsPerPage = 17; 
    for (let i = 0; i < this.products.length; i += maxProductsPerPage) { 
        const chunk = this.products.slice(i, i + maxProductsPerPage); 
        const rows = []; 
        rows.push([ 
            { text: 'Producto', style: 'tableHeader' }, 
            { text: 'Precio', style: 'tableHeader' }, 
            { text: 'Inventario Actual', style: 'tableHeader' } 
        ]); 
        chunk.forEach((product, index) => {
          let displayText = '';
      
          if (product.Peso) {
              displayText = `${product.Peso} gramos`; // Show weight if it exists
          } else if (product.Cantidad) {
              displayText = `${product.Cantidad} Unidades`; // Show quantity if weight does not exist
          } else {
              displayText = 'Sin existencia'; // Optional: Show a message if neither exists
          }
      
          rows.push([
              { text: `${i + index + 1}. ${product.name}`, margin: [0, 10, 0, 5] }, // Numeración aquí 
              { text: this.MostrarPrecioConPuntos(product), margin: [0, 10, 0, 5] }, 
              { text: displayText, margin: [0, 0, 0, 20] } // Display either weight or quantity
          ]);
      });
        
        docDefinition.content.push({ 
            table: { 
                widths: ['*', '*', '*'], 
                body: rows 
            }, 
            layout: { 
                fillColor: function (rowIndex) { 
                    return rowIndex === 0 ? '#0054e9' : null; // Cambiado a azul #0054e9 para la primera fila 
                } 
            } 
        }); 
        if (i + maxProductsPerPage < this.products.length) { 
            docDefinition.content.push({ text: '', pageBreak: 'after' }); 
        } 
    } 
    this.pdfObject = pdfMake.createPdf(docDefinition); 
    if (this.platform.is('cordova')) { 
      this.pdfObject.getBuffer((buffer) => { 
        var blob = new Blob([buffer], { type: 'application/pdf' }); // Cambiado el tipo a 'application/pdf' 
        this.file.writeFile(this.file.dataDirectory, 'Inventario.pdf', blob, { replace: true }).then(fileEntry => { 
          this.fileOpener.open(this.file.dataDirectory + 'Inventario.pdf', 'application/pdf') // Cambiado 'hello.pdf' a 'reporte.pdf' 
            .then(() => console.log('File opened successfully')) 
            .catch(e => console.log('Error opening file', e)); 
        }); 
      }); 
      return true; // Retornar true si se cumple la condición 
    } else { 
      this.pdfObject.download('Inventario.pdf'); 
      return false; // Retornar false si no se cumple la condición 
    } 
  } 

 

  ngOnInit() {
  }

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();
  }

  //Reiniciar pagina

  doRefresh(event) {
    
    setTimeout(() => {
     this.getProducts(),
      event.target.complete();
    }, 1000);
  }


  //Obtener ganacias
  
   getProfits() {
    const total = this.products.reduce((acc, product) => {
      if (product.Peso) {
        const pesoEnKg = product.Peso >= 1000 ? product.Peso / 1000 : product.Peso;
        return acc + (product.precio * pesoEnKg);
      } else if (isNaN(product.precio) || isNaN(product.Cantidad)) {
        return acc + 0; // Considerar NaN como 0
      } else {
        return acc + (product.precio * product.Cantidad);
      }
    }, 0);

    if (total.toString().length <= 3) {
      return total;
    } else {
      const formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return formattedTotal;
    }
  }




  private alertedProducts: Set<string> = new Set(); // Set para almacenar nombres de productos ya alertados

  AlertaStockMinimo(productName: string) {
    if (!this.alertedProducts.has(productName)) { // Verificar si el producto ya ha sido alertado
      this.utilsSvc.presentAlert({
        header: '¡Alerta de Stock Bajo!',
        message: `El producto "${productName}" está por agotarse.`,
        buttons: [
          { text: 'Entendido', role: 'cancel' },
        ],
      });
      this.alertedProducts.add(productName); // Agregar el producto al conjunto de productos alertados
    }
  }

  AlertaStockMaximo(productName: string) {
    if (!this.alertedProducts.has(productName)) { // Verificar si el producto ya ha sido alertado
      this.utilsSvc.presentAlert({
        header: '¡Alerta de Stock Excedido!',
        message: `El producto "${productName}" ha excedido el stock máximo.`,
        buttons: [
          { text: 'Entendido', role: 'cancel' },
        ],
      });
      this.alertedProducts.add(productName); // Agregar el producto al conjunto de productos alertados
    }
  }


  //Orden de productos
  //Orden de productos
  
getProducts() {
  // let path = `usuarios/${this.user().uid}/productos`;
  let path = `productos`;
  this.loading = true;
  let query = [
    orderBy('precio', 'desc'), // Ordenar por precio (opcional)
  ];
  this.firebaseSvc
    .getCollectionData(path, query)
    .subscribe({
      next: (res: any) => {
        this.products = res.map((product: Product) => {
          if (product.stock_min && (product.Peso < product.stock_min || product.Cantidad < product.stock_min)) {
            this.AlertaStockMinimo(product.name);
          }
          if (product.stock_max && (product.Peso > product.stock_max || product.Cantidad > product.stock_max)) {
            this.AlertaStockMaximo(product.name);
          }
          return product;
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
        // Manejar los errores apropiadamente
      },
    });
}
  
  async addUpdateProduct(product?: Product) {

    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product }
    })

    if(success) this.getProducts();
  }  

 // Agregar una función para determinar si mostrar el peso o la cantidad en el HTML
 MostrarStockActualConPuntos(product: Product): string {
  if (product.Peso !== undefined && product.Peso !== null) {
    const pesoString = product.Peso.toString();
    const pesoDigits = pesoString.length;
    
    if (pesoDigits > 3) {
      const formattedPeso = pesoString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
      return `Stock Actual: ${formattedPeso} Gramos`;
    } else {
      return `Stock Actual: ${product.Peso} Gramos`;
    }
  } else {
    return `Stock Actual: ${product.Cantidad} Unidades`;
  }
}

MostrarStockMinConPuntos(product: Product): string {
  if (product.stock_min !== undefined && product.stock_min !== null) {
    const stockMinString = product.stock_min.toString();
    const stockMinDigits = stockMinString.length;
    
    let formattedStockMin: string;

    if (stockMinDigits > 3) {
      formattedStockMin = stockMinString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Insert a dot every three digits
    } else {
      formattedStockMin = stockMinString;
    }

    if (product.Peso !== undefined && product.Peso !== null) {
      return `Stock Mínimo: ${formattedStockMin} Gramos`;
    } else if (product.Cantidad !== undefined && product.Cantidad !== null) {
      return `Stock Mínimo: ${formattedStockMin} Unidades`;
    } else {
      return `Stock Mínimo: ${formattedStockMin}`;
    }
  } else {
    return 'Stock Mínimo no definido';
  }
}

MostrarStockMaxConPuntos(product: Product): string {
  if (product.stock_max !== undefined && product.stock_max !== null) {
      const stockMaxString = product.stock_max.toString();
      const stockMaxDigits = stockMaxString.length;
      let formattedStockMax: string;
      if (stockMaxDigits > 3) {
          formattedStockMax = stockMaxString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Insertar un punto cada tres dígitos
      } else {
          formattedStockMax = stockMaxString;
      }
      if (product.Peso !== undefined && product.Peso !== null) {
          return `Stock Máximo: ${formattedStockMax} Gramos`;
      } else if (product.Cantidad !== undefined && product.Cantidad !== null) {
          return `Stock Máximo: ${formattedStockMax} Unidades`;
      } else {
          return `Stock Máximo: ${formattedStockMax}`;
      }
  } else {
      return 'Stock Máximo no definido';
  }
}

  MostrarPrecioConPuntos(product: Product): string {
    if (product.precio !== undefined && product.precio !== null) {
      const precioString = product.precio.toString();
      const precioDigits = precioString.length;
      
      if (precioDigits > 3) {
        const formattedprecio = precioString.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
        return `${formattedprecio} Pesos Colombianos`;
      } else {
        return `${product.precio} Pesos Colombianos`;
      }
    } else {
      return `Cantidad: ${product.Cantidad}`;
    }
  }

  InversionConPuntos(number: number): string {
    const formattedNumber = isNaN(number) ? '0' : number.toString();
    const digits = formattedNumber.length;
    if (digits > 3) {
      return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Inserta un punto cada tres dígitos
    }
    return formattedNumber;
  }
    



  async EntradaProducto(product: Product) {
    try {
        const alert = await this.utilsSvc.presentAlert({
            header: 'Agregar cantidad del Producto',
            message: '¿Está seguro de agregarle entrada al producto? ¡Esta acción es irreversible!',
            mode: 'ios',
            inputs: [
                {
                    type: 'number',
                    placeholder: product.Peso !== undefined ? 'Ingrese el peso entrante' : 'Ingrese las unidades entrante'
                }
            ],
            buttons: [
                {
                    text: 'Cancelar',
                },
                {
                    text: 'Agregar Producto',
                    handler: async (data) => {
                        let cantidadAgregada = parseFloat(data[0]);
                        if (product.Peso !== null && product.Peso !== undefined) {
                            product.Peso += cantidadAgregada;
                        } else {
                            product.Cantidad += cantidadAgregada;
                        }
                        const registro = { tipo: 'Entrada', producto: product, cantidadAgregada: cantidadAgregada, fecha: new Date() };
                        this.historialService.agregarRegistro(registro);
                        // Call the function to update the product in the product collection
                        await this.actualizar_documento(product);
                        this.utilsSvc.dismissModal({ success: true });
                        this.utilsSvc.presentToast({
                            message: 'Se agregó la entrada con éxito',
                            duration: 1500,
                            color: 'success',
                            position: 'middle',
                            icon: 'checkmark-circle-outline'
                        });
                    }
                },
            ]
        });
    } catch (error) {
        console.error(error);
        this.utilsSvc.presentToast({
            message: error.message,
            duration: 1500,
            color: 'danger',
            position: 'middle',
            icon: 'alert-circle-outline'
        });
    }
}
async SalidaProducto(product: Product) {
  // Verificar si el peso es 0 y si el producto tiene peso
  if (product.Peso === 0) {
    this.utilsSvc.presentToast({
      message: 'No se puede agregar salida a un producto en 0',
      duration: 2000,
      color: 'danger',
      position: 'middle'
    });
    return; // Salir del método si el peso es 0
  }
  if (product.Cantidad === 0) {
    this.utilsSvc.presentToast({
      message: 'No se puede agregar salida a un producto en 0',
      duration: 2000,
      color: 'danger',
      position: 'middle'
    });
    return; // Salir del método si el peso es 0
  }

  const alert = await this.utilsSvc.presentAlert({
    header: 'Agregar salida del Producto',
    message: '¿Está seguro de agregarle salida al producto? ¡Esta acción es irreversible!',
    mode: 'ios',
    inputs: [
      {
        type: 'number',
        placeholder: product.Peso ? 'Ingrese el peso saliente' : 'Ingrese las unidades saliente'
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
      },
      {
        text: 'Agregar Salida',
        handler: async (data) => {
          let cantidadSaliente = parseFloat(data[0]);
          if (product.Peso) {
            if (cantidadSaliente > product.Peso) {
              this.utilsSvc.presentToast({
                message: 'La salida no puede ser superior al stock actual',
                duration: 2000,
                color: 'danger',
                position: 'middle'
              });
              return;
            }
            product.Peso -= cantidadSaliente;
          } else {
            if (cantidadSaliente > product.Cantidad) {
              this.utilsSvc.presentToast({
                message: 'La salida no puede ser superior al stock actual',
                duration: 2000,
                color: 'danger',
                position: 'middle'
              });
              return;
            }
            product.Cantidad -= cantidadSaliente;
          }
          const registro = { tipo: 'Salida', producto: product, cantidadSaliente: cantidadSaliente, fecha: new Date() };
          this.historialService.agregarRegistro(registro);
          await this.actualizar_documento(product);
          this.utilsSvc.dismissModal({ success: true });
          this.utilsSvc.presentToast({
            message: 'Se agregó la Salida con éxito',
            duration: 1500,
            color: 'success',
            position: 'middle',
            icon: 'checkmark-circle-outline'
          });
        }
      },
    ]
  });
}
  async actualizar_documento(product: Product) {
   //   const path = `usuarios/${this.user().uid}/productos/${product.id}`;
   const path = `productos/${product.id}`;
    
      try {
        await this.firebaseSvc.updateDocument(path, product);
        console.log('Producto actualizado en la colección de productos');
      } catch (error) {
        console.error('Error al actualizar el producto en la colección de productos:', error);
        // Manejar el error según sea necesario
      }
    }
  
    async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Borrar Producto',
      message: '¿Está seguro de borrar el producto? Esta acción es irreversible!',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        },
        {
          text: 'Borrar',
          handler: () => {
            this.deleteProduct(product); // Llama a la función de eliminación
          }
        }
      ]
    });
  }

  //Eliminar producto
  async deleteProduct(product: Product){


    //   let path = `usuarios/${this.user().uid}/productos/${product.id}`;
    let path = `productos/${product.id}` 
  
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
  
    
    let imagePath = await this.firebaseSvc.getFilePath(product.image);
    await this.firebaseSvc.deleteFile(imagePath);
  
    this.firebaseSvc.deleteDocument(path).then(async res => {
  
    this.products = this.products.filter(p => p.id != product.id ); 
  
      this.utilsSvc.presentToast({ 
        message: 'Producto eliminado exitosamente',
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

  filterProducts() {
    if (this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase(); // Convertir el término de búsqueda a minúsculas
      this.products = this.products.filter(product => {
        return product.name.toLowerCase().includes(searchTermLower);
      });
    } else {
      this.getProducts(); // Si el campo de búsqueda está vacío, muestra todos los productos nuevamente
    }
  }

}
