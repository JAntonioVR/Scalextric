import * as THREE from '../libs/three.module.js'
import { ThreeBSP } from '../libs/ThreeBSP.js'

import { Porsche911, Ferrari, Car } from './coche.js'
import { Pinchos, Barrera } from './obstaculos.js'

//
// ──────────────────────────────────────────────────────── I ──────────
//   :::::: C I R C U I T O : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────
//

class Circuito extends THREE.Mesh{


    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Crea todo el modelo del circuito y las estructuras de datos necesarias para
    // gestionarlo
        
    constructor(gui){
        super();

        // Creamos el spline
        this.path = this.createSpline();

        // Usaremos un reloj para ajustar la velocidad de los coches mediante las teclas
        // con independencia del ordenador
        this.clock = new THREE.Clock();

        //
        // ─── CARRETERA ───────────────────────────────────────────────────
        //
        var shapeC         = this.createRoadShape();
        var materialC      = new THREE.MeshPhongMaterial({color: 0x575B64});
        var carretera      = this.createExtrusion(shapeC, materialC);
        this.add(carretera);

        //
        // ─── VALLAS ──────────────────────────────────────────────────────
        //    
        var vallas = this.createWalls();
        this.add(vallas[0]);
        this.add(vallas[1]);

        //
        // ─── LINEAS LATERALES ────────────────────────────────────────────
        //    
        var shapeL1   = this.createLine1Shape();
        var shapeL2   = this.createLine2Shape();
        var materialL = new THREE.MeshPhongMaterial({color:0xffffff});
        var linea1    = this.createExtrusion(shapeL1, materialL);
        var linea2    = this.createExtrusion(shapeL2, materialL);
        this.add(linea1);
        this.add(linea2);
        
        //
        // ─── LINEA CENTRAL ───────────────────────────────────────────────
        //    
        var shapeL3    = this.createLine3Shape();
        var materialL3 = new THREE.MeshPhongMaterial({color: 0xD3F084});
        var linea3     = this.createExtrusion(shapeL3, materialL3);
        this.add(linea3);

        //
        // ─── LINEA DE META ───────────────────────────────────────────────
        //
        var geoLM       = new THREE.BoxBufferGeometry(10,0.1,1);
        var texture     = new THREE.TextureLoader().load('./img/finishLine.jpg');
        var materialLM  = new THREE.MeshPhongMaterial ({map: texture});
        var lineaDeMeta = new THREE.Mesh(geoLM,materialLM);
        this.colocaEnCircuito(lineaDeMeta, 1);
        this.lineaDeMeta = lineaDeMeta
        this.add(this.lineaDeMeta);
            
        //
        // ─── TUNEL ───────────────────────────────────────────────────────
        //
        this.add(new Tunel());
            
        //
        // ─── COCHES ──────────────────────────────────────────────────────
        //
        
        // Coche 1
        var car1Model = new Porsche911();
        this.car1 = new Car(car1Model, this.path, gui,1, "Porsche 911");
        this.add(this.car1);
        
        // Coche 2
        var car2Model = new Ferrari();
        this.car2 = new Car(car2Model, this.path, gui,2, "Ferrari California");
        this.add(this.car2);
        
        // Mapa con los nombres de los coches (solo por ahorrar algunos if)
        this.nombresCoches = new Map();
        this.nombresCoches.set(1, "Porsche 911");
        this.nombresCoches.set(2, "Ferrari California");

        // Array con los dos coches, el coche 1 es this.coches[0] y el coche 2 es this.coches[1]
        this.coches = [this.car1, this.car2];

        // Estado de la velocidad de ambos coches
        this.carsState = [Circuito.VELOCIDAD_CTE, Circuito.VELOCIDAD_CTE]; 

        //
        // ─── OBSTACULOS ──────────────────────────────────────────────────
        //

        // Pinchos 1
        this.pinchos1 = new Pinchos();
        this.tpinchos1 = 0.25; // Almacenamos el lugar en el que está el obstáculo para indexación espacial
        // Colocación y orientación a partir del spline
        this.colocaEnCircuito(this.pinchos1, this.tpinchos1);
        this.add(this.pinchos1);
        
        // Barrera 1
        this.barrera1 = new Barrera();
        this.tbarrera1 = 0.15;
        this.colocaEnCircuito(this.barrera1, this.tbarrera1);
        this.add(this.barrera1);

        // Pinchos 2
        this.pinchos2 = new Pinchos();
        this.tpinchos2 = 0.9;
        this.colocaEnCircuito(this.pinchos2, this.tpinchos2);
        this.add(this.pinchos2);
        
        // Barrera 2
        this.barrera2 = new Barrera();
        this.tbarrera2 = 0.6;
        this.colocaEnCircuito(this.barrera2, this.tbarrera2)
        this.add(this.barrera2);
        
        // Mensaje en div de mensajes
        this.setMessage("¡QUE COMIENCE LA CARRERA!");
            
    }

    //
    // ────────────────────────────────────────────────────────────────────────────────── II ──────────
    //   :::::: C R E A C I O N   D E L   M O D E L A D O : :  :   :    :     :        :          :
    // ────────────────────────────────────────────────────────────────────────────────────────────
    //

    //
    // ─── CREACION DE LOS SHAPES ─────────────────────────────────────────────────────
    // Se crean los shape de cada uno de los elementos que se extruyen para crear el 
    // circuito

    // Shape de la carretera
    createRoadShape(){
        var shapeC = new THREE.Shape();
        shapeC.moveTo(2,5);
        shapeC.lineTo(2,-5);
        shapeC.lineTo(0,-5);
        shapeC.lineTo(0,-2.55);
        shapeC.lineTo(0.05,-2.5);
        shapeC.lineTo(0,-2.45);
        shapeC.lineTo(0,2.45);
        shapeC.lineTo(0.05,2.5);
        shapeC.lineTo(0,2.55);
        shapeC.lineTo(0,5);
        shapeC.lineTo(2,5);

        return shapeC;
    }

    // Shape de la valla izquierda
    createWall1Shape(){
        var shapeV1  = new THREE.Shape();
        shapeV1.moveTo(2,5.5);
        shapeV1.lineTo(2,5);
        shapeV1.lineTo(-2,5);
        shapeV1.lineTo(-2,5.5);
        shapeV1.lineTo(2,5.5);

        return shapeV1;
    }

    // Shape de la valla derecha
    createWall2Shape(){
        var shapeV2  = new THREE.Shape();
        shapeV2.moveTo(2,-5);
        shapeV2.lineTo(2,-5.5);
        shapeV2.lineTo(-2,-5.5);
        shapeV2.lineTo(-2,-5);
        shapeV2.lineTo(2,-5);

        return shapeV2;
    }

    // Shape de la linea izquierda de la carretera
    createLine1Shape(){
        var shapeL1 = new THREE.Shape();
        shapeL1.moveTo(0,4.5);
        shapeL1.lineTo(0,4.25);
        shapeL1.lineTo(-0.01,4.25);
        shapeL1.lineTo(-0.01,4.5);
        shapeL1.lineTo(0,4.5);

        return shapeL1;
    }

    // Shape de la linea derecha de la carretera
    createLine2Shape(){
        var shapeL2 = new THREE.Shape();
        shapeL2.moveTo(0,-4.25);
        shapeL2.lineTo(0,-4.5);
        shapeL2.lineTo(-0.01,-4.5);
        shapeL2.lineTo(-0.01,-4.25);
        shapeL2.lineTo(0,-4.25);

        return shapeL2;
    }

    // Shape de la linea central de la carretera
    createLine3Shape(){
        var shapeL3 = new THREE.Shape();
        shapeL3.moveTo(0,0.25);
        shapeL3.lineTo(0,-0.25);
        shapeL3.lineTo(-0.01,-0.25);
        shapeL3.lineTo(-0.01,0.25);
        shapeL3.lineTo(-0,0.25);

        return shapeL3;
    }


    //
    // ─── CREACION DE EXTRUSION ──────────────────────────────────────────────────────
    // A partir de un shape y un material crea un mesh extruyendo dicho shape por el
    // spline y con el material indicado
        
    createExtrusion(shape, material) {
        var options = {steps: 400, curveSegments: 20, extrudePath: this.path};
        var geometry = new THREE.ExtrudeBufferGeometry(shape, options);
        
        var mesh = new THREE.Mesh(geometry, material);
        return mesh;

    }


    //
    // ─── CREACION DEL SPLINE ────────────────────────────────────────────────────────
    // Crea el spline que se usa como ruta del circuito

    createSpline(){
        var pts       = [
            new THREE.Vector3(   0,0,   0),
            new THREE.Vector3( 100,0,   0),
            new THREE.Vector3( 200,0,  50),
            new THREE.Vector3( 150,0, 100),
            new THREE.Vector3( 100,0,  50),
            new THREE.Vector3( 100,0,   0),
            new THREE.Vector3( 100,0,-100),
            new THREE.Vector3(   0,0,-150),
            new THREE.Vector3(-100,0,-100),
            new THREE.Vector3(-100,0,   0),
            new THREE.Vector3(-100,0,  50),
            new THREE.Vector3(-150,0, 100),
            new THREE.Vector3(-200,0,  50),
            new THREE.Vector3(-100,0,   0),
            new THREE.Vector3(   0,0,   0)
        ];

        var spline = new THREE.CatmullRomCurve3(pts,true);
        return spline;
    }


    //
    // ─── CREACION DE LAS VALLAS ─────────────────────────────────────────────────────
    // La creación de las vallas es especial puesto que hay que quitar algunos
    // fragmentos de estas en las intersecciones 

    createWalls(){
        var shapeV1 = this.createWall1Shape();
        var shapeV2 = this.createWall2Shape();
        var materialV = new THREE.MeshPhongMaterial({color: 0xdee9ec});

        var cubo1Geo = new THREE.BoxGeometry(13,4,9);
        cubo1Geo.rotateY(-0.2);
        cubo1Geo.translate(100,0,0);

        var cubo2Geo = new THREE.BoxGeometry(9,4,13);
        cubo2Geo.rotateY(-0.05);
        cubo2Geo.translate(100,0,0);

        var cubo3Geo = new THREE.BoxGeometry(13,4,9);
        cubo3Geo.rotateY(0.2);
        cubo3Geo.translate(-100,0,0);

        var cubo4Geo = new THREE.BoxGeometry(9,4,13);
        cubo4Geo.rotateY(0.05);
        cubo4Geo.translate(-100,0,0);


        var options = {steps: 400, curveSegments: 20, extrudePath: this.path};
        var valla1Geo = new THREE.ExtrudeGeometry(shapeV1, options),
            valla2Geo = new THREE.ExtrudeGeometry(shapeV2, options);

        var valla1BSP = new ThreeBSP ( valla1Geo ),
            valla2BSP = new ThreeBSP ( valla2Geo ),
            cubo1BSP  = new ThreeBSP ( cubo1Geo  ),
            cubo2BSP  = new ThreeBSP ( cubo2Geo  ),
            cubo3BSP  = new ThreeBSP ( cubo3Geo  ),
            cubo4BSP  = new ThreeBSP ( cubo4Geo  );

        valla1BSP = valla1BSP.subtract(cubo1BSP).subtract(cubo2BSP).subtract(cubo3BSP).subtract(cubo4BSP);
        valla2BSP = valla2BSP.subtract(cubo1BSP).subtract(cubo2BSP).subtract(cubo3BSP).subtract(cubo4BSP);
        
        var valla1Geo = valla1BSP.toGeometry(),
            valla2Geo = valla2BSP.toGeometry();
        var valla1BG  = new THREE.BufferGeometry().fromGeometry( valla1Geo ),
            valla2BG  = new THREE.BufferGeometry().fromGeometry( valla2Geo );
            
        var valla1 = new THREE.Mesh( valla1BG , materialV ),
            valla2 = new THREE.Mesh( valla2BG , materialV );
        return [valla1, valla2];
    }


    //
    // ────────────────────────────────────────────────────────────────────────────────────── II ──────────
    //   :::::: G E S T I O N   D E   L A   V E L O C I D A D : :  :   :    :     :        :          :
    // ────────────────────────────────────────────────────────────────────────────────────────────────
    //

    //
    // ─── ACELERAR COCHE I-ÉSIMO ─────────────────────────────────────────────────────
    // Cambia el estado del coche i a "ACELERANDO"
        
    aceleraCoche(i){
        this.carsState[i-1] = Circuito.ACELERANDO;
    }


    //
    // ─── ESTABILIZAR COCHE I-ÉSIMO ───────────────────────────────────────────────────
    // Cambia el estado del coche i a "VELOCIDAD CONSTANTE" (deja de acelerar o frenar)

    estabilizaCoche(i){
        this.carsState[i-1] = Circuito.VELOCIDAD_CTE;
    }


    //
    // ─── FRENAR COCHE I-ÉSIMO ───────────────────────────────────────────────────────
    // Cambia el estado del coche i a "FRENANDO"

    frenaCoche(i){
        this.carsState[i-1] = Circuito.FRENANDO;
    }


    //
    // ────────────────────────────────────────────────────────────────────────────── II ──────────
    //   :::::: G E S T I O N   D E   F E E D B A C K : :  :   :    :     :        :          :
    // ────────────────────────────────────────────────────────────────────────────────────────
    //

    //
    // ─── ANUNCIO DE UNA COLISION ────────────────────────────────────────────────────
    // Se coloca un mensaje en el contenedor de mensajes de que el coche i ha tenido
    // un accidente con un obstáculo

    anunciaColision(i){
        var tecla = (i == 1 ? 'A' : 'K');
        this.setMessage(
            "OH NO! El " + this.nombresCoches.get(i) + " ha sufrido un accidente. Pulsa '"+tecla+"' para volver a la salida"
        );
    }


    //
    // ─── COLOCAR CLASIFICACION ──────────────────────────────────────────────────────
    // Calcula la clasificación de los coches y la coloca en el contenedor de la 
    // clasificación
        
    setClasificacion(){

        var t1 = this.coches[0].getLocation(),
            t2 = this.coches[1].getLocation();

        var str = "<ol>";

        if(t1 > t2) // Va primero el coche 1
            str += "<li>Porsche 911</li><li>Ferrari California</li>";
        else // Va primero el coche 1
            str += "<li>Ferrari California</li><li>Porsche 911</li>";
        
        str += "</ol>"

        document.getElementById("clasificacion").innerHTML =
            "<h2>" + str + "</h2>";

    }


    //
    // ─── COLOCAR MENSAJE ────────────────────────────────────────────────────────────
    // Se coloca el mensaje indicado en el contenedor de mensajes
        
    setMessage(str){
        document.getElementById("Messages").innerHTML =
            "<h2>" + str + "</h2>";
    }


    //
    // ────────────────────────────────────────────────────────────────────────── II ──────────
    //   :::::: G E S T I O N   D E L   J U E G O : :  :   :    :     :        :          :
    // ────────────────────────────────────────────────────────────────────────────────────
    //

    //
    // ─── ¿HAY GANADOR? ──────────────────────────────────────────────────────────────
    // Comprueba si hay o no ganador checkeando si la localización del coche está muy
    // próxima a la meta
        
    hayGanador(){
        if (1.0 - this.car1.getLocation() < 0.05){
            if(this.evaluaColision(this.car1, this.lineaDeMeta))
                return 1;
        }
        if (1.0 - this.car2.getLocation() < 0.05){
            if(this.evaluaColision(this.car2, this.lineaDeMeta))
                return 2;
        }
        return 0;

    }


    //
    // ─── COMENZAR UNA NUEVA PARTIDA ─────────────────────────────────────────────────
    // Coloca los coches en la salida y comienza un nuevo juego
    // se activa al pulsar la letra "K"
        
    nuevoJuego(){
        this.car1.volverASalida();
        this.car2.volverASalida();
        this.setMessage("¡Bienvenidos a una nueva carrera!");
    }


    //
    // ─── RESETEAR COCHE ─────────────────────────────────────────────────────────────
    // Devuelve el coche i a la parrilla de salida
        
    reseteaCoche(i){
        this.getCar(i).volverASalida();
        this.setMessage("El " + this.nombresCoches.get(i) + " ha vuelto a la parrilla de salida");
    }    

    //
    // ─────────────────────────────────────────────────────────────────────────  ─────
    //

    //
    // ─── COLOCA EN CIRCUITO ─────────────────────────────────────────────────────────
    // Coloca y orienta un objeto en una localización determinada del circuito

    colocaEnCircuito(object, t){
        var posicion = this.path.getPointAt(t);
        object.position.copy(posicion);
        var tangente = this.path.getTangentAt(t);
        posicion.add(tangente);
        object.lookAt(posicion);
    }
    

    //
    // ─── EVALUAR COLISIÓN ───────────────────────────────────────────────────────────
    // Evalua la colisión entre dos objetos
 
    evaluaColision(object1, object2){
        var BB1      = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
            BB2 = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        BB1.setFromObject(object1);
        BB2.setFromObject(object2);
        if(BB1.intersectsBox(BB2))
            return true;
        else
            return false;
    }


    //
    // ─── EVALUAR COLISIONES ─────────────────────────────────────────────────────────
    // Evalúa las posibles colisiones entre coches y entre coches y obstáculos
     
    evaluaColisiones(){

        // Entre coches y obstáculos

        if( Math.abs(this.car1.getLocation()-this.tbarrera1) < 0.05){ // Si un coche y un obstaculo están cerca
            if(this.evaluaColision(this.car1, this.barrera1)){        // Se evalúa su colisión
                this.car1.haColisionado();
                this.anunciaColision(1);
            }
        }

        if( Math.abs(this.car1.getLocation()-this.tbarrera2) < 0.05){ 
            if(this.evaluaColision(this.car1, this.barrera2)){        
                this.car1.haColisionado();
                this.anunciaColision(1);
            }
        }    

        if( Math.abs(this.car1.getLocation()-this.tpinchos1) < 0.05){ 
            if(this.evaluaColision(this.car1, this.pinchos1)){        
                this.car1.haColisionado();
                this.anunciaColision(1);
            }
        }
                

        if( Math.abs(this.car1.getLocation()-this.tpinchos2) < 0.05){ 
            if(this.evaluaColision(this.car1, this.pinchos2)){        
                this.car1.haColisionado();
                this.anunciaColision(1);
            }
        }     

        if( Math.abs(this.car2.getLocation()-this.tbarrera1) < 0.05){ // Si un coche y un obstaculo están cerca
            if(this.evaluaColision(this.car2, this.barrera1)){        // Se evalúa su colisión
                this.car2.haColisionado();
                this.anunciaColision(2);
            }
        }

        if( Math.abs(this.car2.getLocation()-this.tbarrera2) < 0.05){ 
            if(this.evaluaColision(this.car2, this.barrera2)){        
                this.car2.haColisionado();
                this.anunciaColision(2);
            }
        }     

        if( Math.abs(this.car2.getLocation()-this.tpinchos1) < 0.05){ 
            if(this.evaluaColision(this.car2, this.pinchos1)){        
                this.car2.haColisionado();
                this.anunciaColision(2);
            }
        }
                

        if( Math.abs(this.car2.getLocation()-this.tpinchos2) < 0.05){ 
            if(this.evaluaColision(this.car2, this.pinchos2)){        
                this.car2.haColisionado();
                this.anunciaColision(2);
            }
        }    

        // Entre ambos coches

        if( this.car1.getPosition().distanceTo( this.car2.getPosition()) < 5 ){ // Si los dos coches están cerca
            if(this.evaluaColision(this.car1, this.car2)){
                this.car1.haColisionado();
                this.car2.haColisionado();
                this.setMessage("OH NO! Los dos coches han chocado. Pulsa 'A' y 'K' para volver a la salida");
            }
        }
    }


    //
    // ─── GETTER DEL COCHE I-ÉSIMO ───────────────────────────────────────────────────
    // Devuelve el coche 1 o el coche 2
        
    getCar(i){
        if( i >= 1 && i <= 2)
            return this.coches[i-1];
    }
 
    //
    // ─── GETTER DEL SPLINE ──────────────────────────────────────────────────────────
    //
     
    getPath(){
        return this.path;
    }


    //
    // ─── METODO UPDATE ──────────────────────────────────────────────────────────────
    //    

    update () {

        var segundos = this.clock.getDelta();
        var incremento = 0.25*segundos;

        // Modificamos si es necesario la velocidad del coche 1
        switch(this.carsState[0]){
            case Circuito.ACELERANDO:
                this.car1.modificaVelocidad(incremento);
            break;
            case Circuito.FRENANDO:
                this.car1.modificaVelocidad(-incremento);
            break;
        }

        // Modificamos si es necesario la velocidad del coche 2
        switch(this.carsState[1]){
            case Circuito.ACELERANDO:
                this.car2.modificaVelocidad(incremento);
            break;
            case Circuito.FRENANDO:
                this.car2.modificaVelocidad(-incremento);
        }

        // Se actualizan los coches y los obstáculos
        this.car1.update();
        this.car2.update();
        this.pinchos1.update();
        this.barrera1.update();
        this.pinchos2.update();
        this.barrera2.update();

        // Se evalúan las colisiones entre coches y entre coches y obstáculos
        this.evaluaColisiones();
        
        // Se calcula y coloca la clasificación
        this.setClasificacion();

        // Comprobamos si hay ganador
        var ganador = this.hayGanador();
        if(ganador){
            this.getCar(ganador).haGanado();
            this.setMessage("¡El " + this.nombresCoches.get(ganador) + " ha ganado la carrera!\n"+
                            "Pulsa 'R' para una nueva carrera");
        }

    }

}

// Constantes para gestionar la velocidad de los coches
Circuito.VELOCIDAD_CTE = 0;
Circuito.ACELERANDO    = 1;
Circuito.FRENANDO      = 2;


//
// ────────────────────────────────────────────────────────────
//   :::::: T Ú N E L : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────
// Un túnel que decora el circuito

class Tunel extends THREE.Object3D{
    
    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Crea la geometría, un material y, por último, el mesh

    constructor(){
        super();

        // Utilizamos geometría constructiva para crear el túnel

        var cilindroExt = new THREE.CylinderGeometry(12,12,60,30,30),
            cilindroInt = new THREE.CylinderGeometry(11,11,60,30,30),
            cubo = new THREE.BoxGeometry(24,60,24);

        cubo.translate(0,0,-17);

        var CEBSP = new ThreeBSP(cilindroExt),
            CIBSP = new ThreeBSP(cilindroInt),
            cBSP  = new ThreeBSP(cubo);

        var finalResult = (CEBSP.subtract(CIBSP)).subtract(cBSP);

        var geometry       = finalResult.toGeometry();
        var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry ) ;

        var material       = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            flatShading: false
        });

        var result         = new THREE.Mesh( bufferGeometry , material ) ;

        result.rotation.set(-Math.PI/2, 0, -Math.PI/2);
        result.position.y = 3;

        this.add(result);

    }

}

// ────────────────────────────────────────────────────────────────────────────────

export { Circuito }