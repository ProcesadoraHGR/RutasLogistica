// Configura Firebase
const firebaseConfig = {
    apiKey: "56295b27a9c62b6b1c082f8f5e8e899cefc09237",
    authDomain: "rutaslogistica-e7846.firebaseapp.com",
    databaseURL: "https://rutaslogistica-e7846-default-rtdb.firebaseio.com",
    projectId: "rutaslogistica-e7846",
    storageBucket: "rutaslogistica-e7846.appspot.com",
    messagingSenderId: "944349651926",
    appId: "944349651926"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);

// Referencia a la base de datos
const database = firebase.database();

// Función para cargar las órdenes de compra en el dropdown
function loadOrders() {
    const orderSelect = document.getElementById('orderSelect');

    // Limpiar opciones existentes
    orderSelect.innerHTML = '<option value="">Selecciona Orden</option>';

    // Escuchar cambios en la referencia de órdenes
    database.ref('ordenes').on('value', (snapshot) => {
        const orders = snapshot.val();
        if (orders) {
            // Iterar sobre las órdenes y actualizar el dropdown
            for (const orderKey in orders) {
                const order = orders[orderKey];

                // Crear una nueva opción y agregarla al dropdown
                const option = document.createElement('option');
                option.value = orderKey;
                option.textContent = `${order.nombreCliente} - ${new Date(order.fecha).toLocaleString()}`;
                orderSelect.appendChild(option);
            }
        }
    });
}

// Función para mostrar los detalles de la orden seleccionada
function displayOrder() {
    const orderSelect = document.getElementById('orderSelect');
    const orderKey = orderSelect.value;

    if (orderKey) {
        // Obtener la referencia de la orden seleccionada
        database.ref(`ordenes/${orderKey}`).once('value', (snapshot) => {
            const order = snapshot.val();

            // Mostrar los detalles de la orden
            document.getElementById('clientName').textContent = order.nombreCliente;
            document.getElementById('commercialName').textContent = order.nombreComercialCliente;
            document.getElementById('clientState').textContent = order.estadoCliente;
            document.getElementById('totalProducts').textContent = order.totalProductos;
            document.getElementById('totalWithDiscount').textContent = order.totalConDescuento.toFixed(2);

            // Mostrar los productos de la orden en la tabla
            const productTableBody = document.getElementById('productTableBody');
            productTableBody.innerHTML = '';

            let totalWeight = 0; // Variable para almacenar el peso total

            order.productos.forEach((product) => {
                const row = document.createElement('tr');

                const nameCell = document.createElement('td');
                nameCell.textContent = product.nombre;
                row.appendChild(nameCell);

                const priceCell = document.createElement('td');
                priceCell.textContent = `$${product.precioUnitario.toFixed(2)}`;
                row.appendChild(priceCell);

                const quantityCell = document.createElement('td');
                quantityCell.textContent = product.cantidad;
                row.appendChild(quantityCell);

                const weightCell = document.createElement('td');
                const weightInput = document.createElement('input');
                weightInput.type = 'number';
                weightInput.min = 0;
                weightInput.value = product.pesoUnitario || 0;
                weightInput.addEventListener('input', () => {
                    product.pesoUnitario = parseFloat(weightInput.value);
                    calculateProductWeight(product);
                    calculateTotalWeight(order.productos);
                });
                weightCell.appendChild(weightInput);
                row.appendChild(weightCell);

                const totalWeightCell = document.createElement('td');
                const productWeight = calculateProductWeight(product);
                totalWeight += productWeight;
                totalWeightCell.textContent = productWeight.toFixed(2);
                row.appendChild(totalWeightCell);

                product.weightCell = totalWeightCell; // Almacenar la celda de peso total en el producto

                productTableBody.appendChild(row);
            });

            // Actualizar el peso total de la orden
            document.getElementById('totalWeight').textContent = totalWeight.toFixed(2);
        });
    } else {
        // Limpiar los detalles de la orden
        document.getElementById('clientName').textContent = '';
        document.getElementById('commercialName').textContent = '';
        document.getElementById('clientState').textContent = '';
        document.getElementById('totalProducts').textContent = '';
        document.getElementById('totalWithDiscount').textContent = '';
        document.getElementById('totalWeight').textContent = '';
        document.getElementById('productTableBody').innerHTML = '';
    }
}

// Función para calcular el peso total de cada producto
function calculateProductWeight(product) {
    const productWeight = product.cantidad * product.pesoUnitario;
    const totalWeightCell = product.weightCell;
    if (totalWeightCell) {
        totalWeightCell.textContent = productWeight.toFixed(2);
    }
    return productWeight;
}

// Función para calcular el peso total de la orden
function calculateTotalWeight(products) {
    let totalWeight = 0;
    
    products.forEach((product) => {
        totalWeight += calculateProductWeight(product);
    });
    
    const totalWeightElement = document.getElementById('totalWeight');
    totalWeightElement.textContent = totalWeight.toFixed(2);

    // Seleccionar el vehículo basado en el peso total
    selectVehicle(totalWeight);
}

// Definir capacidades máximas de los vehículos
const vehicles = [
    { name: 'Saveiro', capacity: 662 },
    { name: 'Caddy', capacity: 779 },
    { name: 'Silverado', capacity: 934 },
    { name: 'Ram', capacity: 1500 }
];

// Función para seleccionar el vehículo adecuado según el peso total
function selectVehicle(totalWeight) {
    let selectedVehicle = 'No es posible transportarlo';
    
    for (const vehicle of vehicles) {
        if (totalWeight <= vehicle.capacity) {
            selectedVehicle = vehicle.name;
            break;
        }
    }
    
    // Mostrar el vehículo seleccionado en el HTML
    document.getElementById('selectedVehicle').textContent = selectedVehicle;
}

// Cargar las órdenes de compra al cargar la página
loadOrders();

// Inicializar Firebase al cargar la página
window.onload = function() {
    // Obtener elementos del DOM
    const clienteSelectContainer = document.getElementById('clienteSelectContainer');
    const addLocationButton = document.getElementById('addLocationButton');
    const mensajeError = document.getElementById('mensajeError');

    // Función para actualizar la lista desplegable de clientes
    function actualizarClienteSelect(containerId) {
        const clienteSelect = document.createElement('select');
        clienteSelect.id = `clienteSelect-${containerId}`;
        clienteSelect.classList.add('clienteSelect');

        clienteSelect.innerHTML = '<option value="">Selecciona el Cliente</option>';

        // Escuchar cambios en la base de datos y actualizar el dropdown
        database.ref('clientes').on('value', (snapshot) => {
            clienteSelect.innerHTML = '<option value="">Selecciona el Cliente</option>';

            snapshot.forEach((childSnapshot) => {
                const cliente = childSnapshot.val();
                const clienteId = childSnapshot.key;

                // Agregar opción al dropdown con nombre del cliente
                clienteSelect.innerHTML += `<option value="${clienteId}">${cliente.nombre}</option>`;
            });
        });

        return clienteSelect;
    }

    // Función para crear una nueva sección de datos del cliente
    function crearNuevaSesionCliente() {
        const newClienteContainer = document.createElement('div');
        newClienteContainer.classList.add('clienteContainer');

        const clienteSelect = actualizarClienteSelect(newClienteContainer.id);
        newClienteContainer.appendChild(clienteSelect);

        const newClienteDataContainer = document.createElement('div');
        newClienteDataContainer.classList.add('datosCliente');
        newClienteDataContainer.style.display = 'none';

        const clienteIdSpan = document.createElement('p');
        clienteIdSpan.innerHTML = '<strong>ID:</strong> <span id="clienteId"></span>';

        const nombreClienteSpan = document.createElement('p');
        nombreClienteSpan.innerHTML = '<strong>Nombre:</strong> <span id="nombreCliente"></span>';

        const coordenadasClienteSpan = document.createElement('p');
        coordenadasClienteSpan.innerHTML = '<strong>Coordenadas:</strong> <span id="coordenadasCliente"></span>';

        newClienteDataContainer.appendChild(clienteIdSpan);
        newClienteDataContainer.appendChild(nombreClienteSpan);
        newClienteDataContainer.appendChild(coordenadasClienteSpan);

        newClienteContainer.appendChild(newClienteDataContainer);

        clienteSelectContainer.appendChild(newClienteContainer);

        // Escuchar cambio en la selección del cliente
        clienteSelect.addEventListener('change', (event) => {
            const clienteId = event.target.value;

            if (clienteId) {
                // Mostrar los datos del cliente seleccionado
                database.ref(`clientes/${clienteId}`).once('value', (snapshot) => {
                    const cliente = snapshot.val();
                    newClienteDataContainer.querySelector('#clienteId').textContent = clienteId;
                    newClienteDataContainer.querySelector('#nombreCliente').textContent = cliente.nombre;
                    newClienteDataContainer.querySelector('#coordenadasCliente').textContent = cliente.coordenadas;

                    // Mostrar la sección de datos del cliente
                    newClienteDataContainer.style.display = 'block';
                });
            } else {
                // Ocultar la sección de datos del cliente si no se ha seleccionado ninguno
                newClienteDataContainer.style.display = 'none';
            }
        });

        return newClienteContainer;
    }

    // Función para agregar un nuevo cliente
    document.getElementById('formCliente').addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar recargar la página

        const nombreCliente = document.getElementById('nombreClienteInput').value;
        const coordenadas = document.getElementById('coordenadasInput').value;

        // Verificar si el cliente ya existe en la base de datos
        database.ref('clientes').orderByChild('nombre').equalTo(nombreCliente).once('value', (snapshot) => {
            if (snapshot.exists()) {
                mensajeError.style.display = 'block';
            } else {
                // Agregar el nuevo cliente a la base de datos
                const nuevoClienteRef = database.ref('clientes').push();
                nuevoClienteRef.set({
                    nombre: nombreCliente,
                    coordenadas: coordenadas
                });

                // Limpiar campos del formulario
                document.getElementById('nombreClienteInput').value = '';
                document.getElementById('coordenadasInput').value = '';

                // Ocultar mensaje de error
                mensajeError.style.display = 'none';
            }
        });
    });

    // Evento para agregar una nueva sección de datos del cliente
    addLocationButton.addEventListener('click', () => {
        crearNuevaSesionCliente();
    });

    // Inicializar el mapa
    var map = L.map('map').setView([23.6345, -102.5528], 6);

    // Agregar la capa de mosaico
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Agregar el control de enrutamiento
    var control = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
        reverseWaypoints: true,
        showAlternatives: true,
        lineOptions: {
            styles: [{ color: 'blue', weight: 4, opacity: 0.7 }]
        },
        altLineOptions: {
            styles: [{ color: 'gray', weight: 2, opacity: 0.5 }]
        }
    }).addTo(map);

    // Evento para generar la ruta con Leaflet Routing Machine
document.getElementById('generate-route').addEventListener('click', () => {
    const clienteDataContainers = document.querySelectorAll('.datosCliente');
    const waypoints = [];

    clienteDataContainers.forEach(dataContainer => {
        const coordenadasElement = dataContainer.querySelector('#coordenadasCliente');
        if (coordenadasElement) {
            const coordenadas = coordenadasElement.textContent.trim();
            if (coordenadas) {
                waypoints.push(L.latLng(coordenadas.split(',')));
            }
        }
    });

    // Establecer los waypoints en el control de enrutamiento
    control.setWaypoints(waypoints);
});

    // Crear la sección inicial de datos del cliente
    crearNuevaSesionCliente();

// Evento para calcular y mostrar la ruta en Google Maps
document.getElementById('generate-route').addEventListener('click', () => {
    const clienteDataContainers = document.querySelectorAll('.datosCliente');

    let googleMapsLink = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';

    const waypoints = [];

    // Variables para manejar la primera ubicación como partida y las demás como waypoints
    let isFirstLocation = true;
    let firstLocation = '';

    clienteDataContainers.forEach(dataContainer => {
        const coordenadasElement = dataContainer.querySelector('#coordenadasCliente');
        if (coordenadasElement) {
            const coordenadas = coordenadasElement.textContent.trim();
            if (coordenadas) {
                if (isFirstLocation) {
                    // La primera ubicación se establece como el origen (partida)
                    firstLocation = encodeURIComponent(coordenadas);
                    isFirstLocation = false;
                } else {
                    // Las ubicaciones restantes se agregan como waypoints
                    waypoints.push(encodeURIComponent(coordenadas));
                }
            }
        }
    });

    // Construir el enlace de Google Maps con la estructura correcta
    if (firstLocation) {
        googleMapsLink += `&origin=${firstLocation}`;
    }

    if (waypoints.length > 0) {
        googleMapsLink += `&waypoints=${waypoints.join('|')}`;
    }

    // Eliminar el contenido previo de linkContainer
    const linkContainer = document.getElementById('route-container');
    linkContainer.innerHTML = '';

    // Crear un botón dinámico para abrir la ruta en Google Maps
    const openMapButton = document.createElement('button');
    openMapButton.textContent = 'Abrir Ruta en Google Maps';
    openMapButton.classList.add('dynamic-button'); // Agregar la clase CSS
    openMapButton.addEventListener('click', () => {
        window.open(googleMapsLink, '_blank');
    });

    // Crear un botón dinámico para compartir la ruta por WhatsApp
    const shareWhatsAppButton = document.createElement('button');
    shareWhatsAppButton.textContent = 'Compartir en WhatsApp';
    shareWhatsAppButton.classList.add('dynamic-button'); // Agregar la clase CSS
    shareWhatsAppButton.addEventListener('click', () => {
        const encodedMessage = encodeURIComponent(`¡Te comparto esta ruta en Google Maps!\n${googleMapsLink}`);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    });

    // Agregar los botones al contenedor
    linkContainer.appendChild(openMapButton);
    linkContainer.appendChild(shareWhatsAppButton);
});


    // Evento para abrir Google Maps con coordenadas
    document.getElementById('coordinatesForm').addEventListener('submit', function(event) {
        event.preventDefault();

        // Obtener las coordenadas ingresadas por el usuario
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');

        // Obtener los valores de latitud y longitud sin procesar
        const latitude = latitudeInput.value.trim();
        const longitude = longitudeInput.value.trim();

        // Construir la URL de Google Maps con las coordenadas
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        // Abrir la URL en una nueva pestaña/ventana
        window.open(googleMapsUrl, '_blank');
    });
};


async function captureAndDownloadCombinedImage() {
    const mapElement = document.getElementById('map');
    const detailsOrderElement = document.getElementById('orderDetails');

    try {
        // Capture the map and order details as separate images
        const [mapImage, detailsImage] = await Promise.all([
            domtoimage.toPng(mapElement),
            domtoimage.toPng(detailsOrderElement),
        ]);

        // Create a canvas for the combined image
        const combinedCanvas = document.createElement('canvas');
        const ctx = combinedCanvas.getContext('2d');

        // Create image objects from the captured images
        const mapImg = new Image();
        const detailsImg = new Image();

        // Set the image sources and wait for them to load
        mapImg.src = mapImage;
        detailsImg.src = detailsImage;
        await Promise.all([
            new Promise((resolve) => (mapImg.onload = resolve)),
            new Promise((resolve) => (detailsImg.onload = resolve)),
        ]);

        // Calculate the maximum width and height for the combined canvas
        const maxWidth = Math.max(mapImg.width, detailsImg.width);
        const totalHeight = mapImg.height + detailsImg.height + 100; // Add 100 pixels of separation

        // Set the size of the combined canvas with some padding
        const padding = 20;
        combinedCanvas.width = maxWidth + padding * 2;
        combinedCanvas.height = totalHeight + padding * 2;

        // Fill the background with white color
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

        // Calculate the center position for the map
        const centerX = combinedCanvas.width / 2;
        const mapY = padding + detailsImg.height + 100; // Add 100 pixels of separation

        // Draw the order details on the combined canvas (already centered)
        ctx.drawImage(detailsImg, centerX - detailsImg.width / 2, padding);

        // Draw the map a few pixels to the right of the center
        const mapOffsetX = 50; // Adjust this value to move the map more or less to the right
        ctx.drawImage(mapImg, centerX - mapImg.width / 2 + mapOffsetX, mapY);

        // Convert the combined canvas to a blob and download as an image
        combinedCanvas.toBlob((blob) => {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'mapa_con_detalles.png';
            downloadLink.click();

            URL.revokeObjectURL(downloadLink.href);
        }, 'image/png');
    } catch (error) {
        console.error('Error al capturar el mapa con detalles de la orden:', error);
    }
}

// Evento para capturar el mapa y los detalles de la orden al hacer clic en el botón "BotonGuardar"
document.getElementById('BotonGuardar').addEventListener('click', () => {
    // Capturar el mapa y los detalles de la orden y descargarlos como una imagen combinada
    captureAndDownloadCombinedImage();
});
