import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Historial } from 'src/app/models/historial.model';
import { Product } from 'src/app/models/product.model';
import { DatePipe } from '@angular/common'; // Import DatePipe
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {
  selectedButton: string
  BotonTotal: string = 'Total'
  BotonEntrada: string = 'Entrada'
  BotonSalida: string = 'Salida'
  historiales: Observable<Historial[]>;
  products: Product[] = [];
  filtroTipo: string = 'Total'; // New property to st
  noResultados: boolean = false;
  searchTerm: string = '';
  visible = false;
  
  
  constructor(private firestore: AngularFirestore, private datePipe: DatePipe) { } // Inject DatePipe
  historialesSubject: BehaviorSubject<Historial[]> = new BehaviorSubject([]);

 
  
  ngOnInit() {
    this.selectedButton = 'Total'; // Establecer el botón Historial Total como seleccionado por defecto
    this.historiales = this.firestore.collection<Historial>('historial', ref => ref.orderBy('fecha', 'desc')).valueChanges();
  }

  filtrarHistorialTotal() {
    this.selectedButton = 'Total';
    this.historiales = this.firestore.collection<Historial>('historial', ref => ref.orderBy('fecha', 'desc')).valueChanges();
  
    this.historiales.subscribe((historiales) => {
      if (historiales.length === 0) {
        this.noResultados = true;
      } else {
        this.noResultados = false;
      }
    });
  }

  filtrarHistorial(tipo: string) {
    this.selectedButton = tipo;
    // Order by date in descending order
    this.historiales = this.firestore.collection<Historial>('historial', ref => ref.where('tipo', '==', tipo).orderBy('fecha', 'desc')).valueChanges();
  
    this.historiales.subscribe((historiales) => {
      if (historiales.length === 0) {
        this.noResultados = true;
      } else {
        this.noResultados = false;
      }
    });
  }
  
  formatDate(timestamp: any): string {
    const date = new Date(timestamp.seconds * 1000); // Convertir el timestamp a una fecha
    return this.datePipe.transform(date, 'EEEE d \'de\' MMMM \'del\' y \'a las\' h:mm a', 'es'); // Formatear la fecha en el idioma español
  }

  //generatePDF(tipo: string) {
  //  const doc = new jsPDF();
  //  let yPos = 10; // Posición inicial en Y para empezar a escribir los historiales
  //  // Título del documento
  //  doc.setFontSize(16);
  //  doc.text(`Historial de Movimientos - ${tipo}`, 10, yPos);
  //  yPos += 10; // Incrementar la posición Y
  //
  //  // Recorrer cada historial y agregar la información al PDF
  //  this.historiales.subscribe((historiales) => {
  //    historiales.forEach((historial) => {
  //      if (tipo === 'Total' || historial.tipo === tipo) {
  //        doc.setFontSize(12);
  //        doc.text(`Producto: ${historial.producto.name}`, 10, yPos);
  //        yPos += 10;
  //        doc.text(`Acción: ${historial.tipo}`, 10, yPos);
  //        yPos += 10;
  //        doc.text(`Cantidad: ${historial.tipo === 'Entrada' ? '+ ' : '- '}${historial.cantidadAgregada ? historial.cantidadAgregada : historial.cantidadSaliente} ${historial.producto.Peso ? 'Gramos' : 'Unidades'}`, 10, yPos);
  //        yPos += 10;
  //        doc.text(`Fecha: ${this.formatDate(historial.fecha)}`, 10, yPos);
  //        yPos += 20; // Espacio entre historiales
  //
  //        // Verificar si es necesario agregar una nueva página
  //        if (yPos > 280) {
  //          doc.addPage(); // Agregar una nueva página
  //          yPos = 10; // Reiniciar la posición Y
  //        }
  //      }
  //    });
  //
  //    doc.save(`historial_movimientos_${tipo.toLowerCase()}.pdf`);
  //  });
  //} 

  // Agregar una variable para controlar si se ha hecho clic en la pantalla
// Agregar una variable para controlar si se ha hecho clic en la pantalla
isScreenClicked = false;

// Función para vaciar el campo de búsqueda
vaciarCampoBuscador() {
  this.searchTerm = ''; // Vaciar el campo de búsqueda
  this.isScreenClicked = true; // Marcar que se ha hecho clic en la pantalla
}

// Función para buscar productos evitando reiniciar la búsqueda al hacer clic en la pantalla
// Función para buscar productos y ordenar los resultados de más reciente a más antiguo

buscarProductos() {
  if (!this.isScreenClicked && this.searchTerm.trim() !== '') {
    // Dividir el término de búsqueda en palabras individuales
    const palabras = this.searchTerm.toLowerCase().split(' ');

    // Realizar la búsqueda según el botón seleccionado
    if (this.selectedButton === 'Total') {
      // Búsqueda general si selectedButton es 'Total'
      this.historiales = this.firestore.collection<Historial>('historial', ref => {
        let query = ref.orderBy('fecha', 'desc');
        for (const palabra of palabras) {
          query = query.where('producto.name', '>=', palabra).where('producto.name', '<=', palabra + '\uf8ff');
        }
        return query;
      }).valueChanges();
    } else {
      // Búsqueda por tipo y producto si selectedButton es 'Entrada' o 'Salida'
      this.historiales = this.firestore.collection<Historial>('historial', ref => {
        let query = ref.where('tipo', '==', this.selectedButton).orderBy('fecha', 'desc');
        for (const palabra of palabras) {
          query = query.where('producto.name', '>=', palabra).where('producto.name', '<=', palabra + '\uf8ff');
        }
        return query;
      }).valueChanges();
    }

    this.historiales.subscribe((historiales) => {
      this.noResultados = historiales.length === 0;
    });
  }

  // Restablecer el valor del término de búsqueda a una cadena vacía después de la búsqueda
  this.searchTerm = ''; // Vaciar el campo de búsqueda
  this.isScreenClicked = false; // Reiniciar el estado de clic en la pantalla
}

///Calendario

 
  toggleCalendar() {
  
    this.visible = !this.visible;
  
  }

// Declarar una variable para controlar la visibilidad del mensaje de error
errorNoFechas: boolean = false;

Calendario(event) {
  const selectedDate = new Date(event.detail.value);
  const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
  
  if (this.selectedButton === 'Entrada') {
    this.historiales = this.firestore.collection<Historial>('historial', ref =>
      ref.where('tipo', '==', 'Entrada').where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
    ).valueChanges();
  } else if (this.selectedButton === 'Salida') {
    this.historiales = this.firestore.collection<Historial>('historial', ref =>
      ref.where('tipo', '==', 'Salida').where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
    ).valueChanges();
  } else {
    this.historiales = this.firestore.collection<Historial>('historial', ref =>
      ref.where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
    ).valueChanges();
  }
  
  this.historiales.subscribe((historiales) => {
    if (historiales.length === 0) {
      this.noResultados = true;
    } else {
      this.noResultados = false;
    }
  });
  
  this.visible = false;
}
}