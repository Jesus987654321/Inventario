import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { Historial } from 'src/app/models/historial.model';
import { Product } from 'src/app/models/product.model';
import { DatePipe } from '@angular/common'; // Import DatePipe
import { BehaviorSubject } from 'rxjs';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
  pdfObject: any;
  productoSeleccionado: Product | null = null; 
  busquedaPorFecha: boolean = false; // Calendario
  startDate: Date | null = null; // Variable para la fecha de inicio
  endDate: Date | null = null; // Variable para la fecha de fin
  showPdfButtons: boolean = true; // Variable para controlar la visibilidad de los botones PDF

  constructor(private firestore: AngularFirestore, private datePipe: DatePipe) { } // Inject DatePipe
  historialesSubject: BehaviorSubject<Historial[]> = new BehaviorSubject([]);

  onStartDateChange(event: any) {
    this.startDate = new Date(event.detail.value);
    this.filtrarPorRangoFechas();
}

onEndDateChange(event: any) {
    this.endDate = new Date(event.detail.value);
    this.filtrarPorRangoFechas();
}

filtrarPorRangoFechas() {
    if (this.startDate && this.endDate) {
        const startOfDay = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
        const endOfDay = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() + 1); // Fin del día

        this.historiales = this.firestore.collection<Historial>('historial', ref =>
            ref.where('fecha', '>=', startOfDay).where('fecha', '<', endOfDay).orderBy('fecha', 'desc')
        ).valueChanges();

        this.historiales.subscribe((historiales) => {
            this.noResultados = historiales.length === 0;
            this.showPdfButtons = false; // Ocultar los botones PDF existentes
        });
    } else {
        // Si no hay fechas seleccionadas, podrías cargar el historial completo o mostrar un mensaje
        this.cargarHistorial();
        this.showPdfButtons = true; // Mostrar los botones PDF existentes
    }
}

generarPdf(tipo: string) {
  let docDefinition = {
    content: [],
    header: {
      margin: [0, 10, 0, 0],
      text: [
        { text: `Historial ${tipo}`, alignment: 'center' },
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
        fillColor: '#0054e9',
        alignment: 'center'
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      }
    },
  };

  // Filtrar historiales según el tipo
  let filteredHistoriales: Historial[] = [];
  this.historialesSubject.subscribe(historiales => {
    if (tipo === 'Total') {
      filteredHistoriales = historiales; // Todos los historiales
    } else {
      filteredHistoriales = historiales.filter(historial => historial.tipo === tipo); // Filtrar por tipo
    }

    const rows = [];
    rows.push([
      { text: 'Producto', style: 'tableHeader' },
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Tipo', style: 'tableHeader' }
    ]);

    filteredHistoriales.forEach(historial => {
      rows.push([
        { text: historial.producto.name, margin: [0, 10, 0, 5] },
        { text: this.formatDate(historial.fecha), margin: [0, 10, 0, 5] },
        { text: historial.tipo, margin: [0, 10, 0, 5] }
      ]);
    });

    docDefinition.content.push({
      table: {
        widths: ['*', '*', '*'],
        body: rows
      }
    });

    this.pdfObject = pdfMake.createPdf(docDefinition);
    this.pdfObject.download(`Historial_${tipo}.pdf`);
  });
}
  ngOnInit() {
    this.selectedButton = 'Total'; // Establecer el botón Historial Total como seleccionado por defecto
  
    this.historiales = this.firestore.collection<Historial>('historial', ref => ref.orderBy('fecha', 'desc')).valueChanges();
    this.cargarHistorial();
    this.cargarProductos(); // Cargar los productos al iniciar
  }

  cargarProductos() {
    this.firestore.collection<Product>('productos').valueChanges().subscribe(products => {
      this.products = products;
    });
  }
  cargarHistorial() {
    this.historiales = this.firestore.collection<Historial>('historial', ref => ref.orderBy('fecha', 'desc')).valueChanges();
    this.historiales.subscribe(historiales => {
      this.historialesSubject.next(historiales); // Almacena todos los historiales
      this.noResultados = historiales.length === 0;
    });
  }

  //Buscador de nombres
  filtrarPorNombre() {
    if (this.searchTerm.trim() === '') {
      this.cargarHistorial(); // Si no hay término de búsqueda, cargar todos los historiales
      return;
    }
  
    const searchTermLower = this.searchTerm.toLowerCase(); // Convertir el término de búsqueda a minúsculas
  
    this.historialesSubject.subscribe(historiales => {
      const filteredHistoriales = historiales.filter(historial => 
        historial.producto.name.toLowerCase().includes(searchTermLower)
      );
      this.historiales = of(filteredHistoriales); // Actualizar la lista de historiales filtrados
      this.noResultados = filteredHistoriales.length === 0;
    });
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
  
  // Actualizar la variable busquedaPorFecha a true cuando se selecciona una fecha
  this.busquedaPorFecha = true;

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