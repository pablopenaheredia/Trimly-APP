import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaTrash, FaFilePdf } from "react-icons/fa";
import "./FacturacionTab.css";
import { generarFacturaPDF } from "../../utils/pdfGenerator";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  estado: string;
  categoria: string;
  marca: string;
}

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  activo: boolean;
}

interface Servicio {
  id: number;
  servicio: string;
  descripcion: string;
  duracion: number;
  precio: number;
  estado: boolean;
}

interface Turno {
  id: number;
  clienteId: number;
  servicioId: number;
  cliente: { nombre: string,apellido: string };
  servicio: { servicio: string; precio: number };
  fecha: string;
  estado: string;
}

interface ItemFactura {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  stockDisponible: number;
  esTurnoServicio?: boolean;
  esTurnoProducto?: boolean;
  productoOriginalId?: number;
}

const FacturacionTab: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [turnosPendientes, setTurnosPendientes] = useState<Turno[]>([]);
  const [itemsFactura, setItemsFactura] = useState<ItemFactura[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [tipoMensaje, setTipoMensaje] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");

  const mostrarMensaje = (texto: string, tipo: string) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(null), 3000);
  };

  // Función para calcular stock disponible
  const calcularStockDisponible = (productoId: number): number => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return 0;

    // Buscar si el producto ya está en la factura
    const enFactura = itemsFactura.find(
      (item) => item.productoId === productoId
    );

    // Si está en la factura, restar la cantidad ya seleccionada
    const cantidadReservada = enFactura ? enFactura.cantidad : 0;

    // Retornar el stock real disponible
    return producto.stock - cantidadReservada;
  };

  // Función para cambiar cantidad manualmente
  const cambiarCantidadManual = (productoId: number, nuevaCantidad: string) => {
    // Validar que solo contenga números
    if (!/^\d*$/.test(nuevaCantidad)) {
      return; // No hacer nada si contiene caracteres no numéricos
    }

    const cantidad = parseInt(nuevaCantidad) || 0;
    const item = itemsFactura.find((item) => item.productoId === productoId);

    if (!item) return;

    // Si la cantidad es 0, eliminar el item
    if (cantidad === 0) {
      setItemsFactura((items) =>
        items.filter((item) => item.productoId !== productoId)
      );
      return;
    }

    // Validar que no exceda el stock disponible para productos
    const esProducto =
      !item.nombre.includes(" - ") &&
      !servicios.some((s) => s.id === productoId);

    if (esProducto) {
      const producto = productos.find((p) => p.id === productoId);
      const stockTotal = producto?.stock || 0;

      if (cantidad > stockTotal) {
        mostrarMensaje(
          `No se puede exceder el stock total disponible (${stockTotal} unidades)`,
          "error"
        );
        return;
      }
    } else if (cantidad > item.stockDisponible) {
      // Para servicios y turnos, usar el límite configurado
      mostrarMensaje(`No se puede exceder el límite disponible`, "error");
      return;
    }

    // Actualizar la cantidad
    setItemsFactura((items) =>
      items.map((item) =>
        item.productoId === productoId ? { ...item, cantidad: cantidad } : item
      )
    );
  };

  // Función para cambiar precio unitario manualmente
  const cambiarPrecioUnitario = (productoId: number, nuevoPrecio: string) => {
    // Validar que solo contenga números y punto decimal
    if (!/^\d*\.?\d*$/.test(nuevoPrecio)) {
      return; // No hacer nada si contiene caracteres no válidos
    }

    const precio = parseFloat(nuevoPrecio) || 0;
    
    // Actualizar el precio unitario
    setItemsFactura((items) =>
      items.map((item) =>
        item.productoId === productoId ? { ...item, precioUnitario: precio } : item
      )
    );
  };
  // Cargar clientes
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const res = await fetch("http://localhost:3000/clientes");
        if (!res.ok) throw new Error("Error al cargar clientes");
        const data = await res.json();
        const clientesActivos = data.filter((c: Cliente) => c.activo);
        setClientes(clientesActivos);
        setClientesFiltrados(clientesActivos);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        mostrarMensaje("Error al cargar clientes", "error");
      }
    };

    cargarClientes();
  }, []);

  // Filtrar clientes según búsqueda
  useEffect(() => {
    const filtrados = clientes.filter((cliente) => {
      const nombreCompleto =
        `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
      const termino = busquedaCliente.toLowerCase();
      return (
        nombreCompleto.includes(termino) ||
        cliente.dni.includes(termino) ||
        cliente.telefono.includes(termino) ||
        cliente.email.toLowerCase().includes(termino)
      );
    });
    setClientesFiltrados(filtrados);
  }, [busquedaCliente, clientes]);

  // Manejar selección de cliente
  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(`${cliente.nombre} ${cliente.apellido}`);
    setMostrarDropdownClientes(false);
  };

  // Limpiar selección de cliente
  const limpiarCliente = () => {
    // Solo permitir limpiar si no hay turnos en la factura
    const hayTurnos = itemsFactura.some((item) =>
      turnosPendientes.some((t) => t.id === item.productoId)
    );

    if (hayTurnos && clienteBloqueado) {
      mostrarMensaje(
        "No puedes cambiar el cliente mientras haya turnos en la factura",
        "error"
      );
      return;
    }

    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setMostrarDropdownClientes(false);
    setClienteBloqueado(false);
  };
  // Agregar/quitar un turno de la factura (toggle)
  const toggleTurno = (turno: Turno) => {
    const itemExistente = itemsFactura.find(
      (item) => item.productoId === turno.id
    );

    if (itemExistente) {
      // Si ya está agregado, lo quitamos (deseleccionar)
      setItemsFactura((items) =>
        items.filter((item) => item.productoId !== turno.id)
      );

      // Si no quedan más turnos, desbloquear cliente
      const turnosRestantes = itemsFactura.filter(
        (item) => item.productoId !== turno.id && 
        turnosPendientes.some((t) => t.id === item.productoId)
      );

      if (turnosRestantes.length === 0) {
        setClienteBloqueado(false);
      }

      mostrarMensaje(
        `${turno.cliente.nombre} - ${turno.servicio.servicio} removido de la factura`,
        "exito"
      );
      return;
    }

    // Si no está agregado, lo agregamos (seleccionar)
    
    // Cargar automáticamente el cliente del turno
    const clienteDelTurno = clientes.find((c) => c.id === turno.clienteId);
    if (clienteDelTurno && !clienteSeleccionado) {
      setClienteSeleccionado(clienteDelTurno);
      setBusquedaCliente(
        `${clienteDelTurno.nombre} ${clienteDelTurno.apellido}`
      );
      setClienteBloqueado(true); // Bloquear edición del cliente
    }

    // Si ya hay un cliente seleccionado y es diferente al del turno
    if (clienteSeleccionado && clienteSeleccionado.id !== turno.clienteId) {
      mostrarMensaje(
        "No puedes agregar turnos de diferentes clientes en la misma factura",
        "error"
      );
      return;
    }

    setItemsFactura([
      ...itemsFactura,
      {
        productoId: turno.id,
        nombre: turno.servicio.servicio, // ✅ Solo el nombre del servicio
        cantidad: 1,
        precioUnitario: turno.servicio.precio,
        stockDisponible: 999,
      },
    ]);

    mostrarMensaje(
      `${turno.cliente.nombre} - ${turno.servicio.servicio} agregado a la factura`,
      "exito"
    );
  };

  // Agregar un producto a la factura
  const agregarProducto = (producto: Producto) => {
    if (producto.stock <= 0) {
      mostrarMensaje(
        `No hay stock disponible para ${producto.nombre}`,
        "error"
      );
      return;
    }

    const itemExistente = itemsFactura.find(
      (item) => item.productoId === producto.id
    );

    if (itemExistente) {
      if (itemExistente.cantidad >= itemExistente.stockDisponible) {
        mostrarMensaje(
          `No se puede exceder el stock disponible para ${producto.nombre}`,
          "error"
        );
        return;
      }

      setItemsFactura((items) =>
        items.map((item) =>
          item.productoId === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setItemsFactura([
        ...itemsFactura,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          stockDisponible: producto.stock,
        },
      ]);
    }

    mostrarMensaje(`${producto.nombre} agregado a la factura`, "exito");
  };

  // Agregar un servicio a la factura
  const agregarServicio = (servicio: Servicio) => {
    const itemExistente = itemsFactura.find(
      (item) =>
        item.productoId === servicio.id && item.nombre === servicio.servicio
    );

    if (itemExistente) {
      setItemsFactura((items) =>
        items.map((item) =>
          item.productoId === servicio.id && item.nombre === servicio.servicio
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setItemsFactura([
        ...itemsFactura,
        {
          productoId: servicio.id,
          nombre: servicio.servicio,
          cantidad: 1,
          precioUnitario: servicio.precio,
          stockDisponible: 999, // Los servicios no tienen límite de stock
        },
      ]);
    }

    mostrarMensaje(`${servicio.servicio} agregado a la factura`, "exito");
  };

  // Función para incrementar la cantidad de un producto/servicio
  const incrementarCantidad = (productoId: number) => {
    const item = itemsFactura.find((item) => item.productoId === productoId);
    if (!item) return;

    if (item.cantidad >= item.stockDisponible) {
      mostrarMensaje(`No se puede exceder el stock disponible`, "error");
      return;
    }

    setItemsFactura((items) =>
      items.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  // Función para decrementar la cantidad de un producto/servicio
  const decrementarCantidad = (productoId: number) => {
    const item = itemsFactura.find((item) => item.productoId === productoId);
    if (!item) return;

    if (item.cantidad <= 1) {
      // Eliminar el producto si la cantidad es 1 y se quiere decrementar
      setItemsFactura((items) =>
        items.filter((item) => item.productoId !== productoId)
      );
    } else {
      setItemsFactura((items) =>
        items.map((item) =>
          item.productoId === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
      );
    }
  };

  // Función para eliminar un producto/servicio de la factura
  const eliminarProducto = (productoId: number) => {
    setItemsFactura((items) =>
      items.filter((item) => item.productoId !== productoId)
    );
  };

  // Calcular el total de la factura
  const total = itemsFactura.reduce(
    (sum, item) => sum + item.cantidad * item.precioUnitario,
    0
  );

  // Obtener los productos desde el backend
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch("http://localhost:3000/producto");
        if (!res.ok) {
          throw new Error("Error al cargar productos");
        }
        const data = await res.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        mostrarMensaje("Error al cargar los productos", "error");
      }
    };

    cargarProductos();
  }, []);

  // Obtener los servicios activos desde el backend
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const res = await fetch("http://localhost:3000/servicios/activos");
        if (!res.ok) {
          throw new Error("Error al cargar servicios");
        }
        const data = await res.json();
        setServicios(data);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
        mostrarMensaje("Error al cargar los servicios", "error");
      }
    };

    cargarServicios();
  }, []);

  // Obtener los turnos pendientes de cobro
  useEffect(() => {
    const cargarTurnosPendientes = async () => {
      try {
        const res = await fetch("http://localhost:3000/turnos");
        if (!res.ok) {
          throw new Error("Error al cargar los turnos");
        }
        const data = await res.json();
        // Filtrar solo los turnos con estado 'pendiente'
        const pendientes = data.filter((t: Turno) => t.estado === 'pendiente');
        setTurnosPendientes(pendientes);
      } catch (error) {
        console.error("Error al cargar los turnos:", error);
        mostrarMensaje("Error al cargar los turnos", "error");
      }
    };

    cargarTurnosPendientes();
  }, []);

  // Calcular la demora de los turnos
  const calcularDemora = (fechaTurno: string) => {
    const fechaActual = new Date();
    const fechaTurnoDate = new Date(fechaTurno);
    const diferenciaTiempo = fechaActual.getTime() - fechaTurnoDate.getTime();
    const diasDeDemora = Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
    return diasDeDemora;
  };

  // Asignar el color del badge según los días de demora
  const obtenerColorBadge = (dias: number) => {
    if (dias <= 0) return "green"; // Hoy
    if (dias <= 2) return "yellow"; // 1-2 días
    if (dias <= 7) return "orange"; // 3-7 días
    return "red"; // Más de 8 días
  };

  const finalizarFactura = async () => {
    try {
      // Validar que hay cliente seleccionado
      if (!clienteSeleccionado) {
        mostrarMensaje("Debes seleccionar un cliente para facturar.", "error");
        return;
      }

      // Obtener clienteId del primer turno seleccionado si no hay cliente seleccionado manualmente
      const turnoItem = itemsFactura.find((item) =>
        turnosPendientes.some((t) => t.id === item.productoId)
      );
      let clienteId: number | undefined = clienteSeleccionado?.id;
      if (!clienteId && turnoItem) {
        const turno = turnosPendientes.find(
          (t) => t.id === turnoItem.productoId
        );
        clienteId = turno?.clienteId;
      }

      if (!clienteId) {
        mostrarMensaje(
          "Debes seleccionar un cliente para facturar.",
          "error"
        );
        return;
      }

      const detalles = itemsFactura.map((item) => {
        // Si el nombre tiene " - " es un turno/servicio asociado a turno
        // Verificar si es un turno por su productoId en lugar del nombre
        const esTurno = turnosPendientes.some((t) => t.id === item.productoId);
        if (esTurno) {
          const turno = turnosPendientes.find((t) => t.id === item.productoId);
          return {
            tipo_item: "servicio",
            itemId: turno?.servicioId ?? Number(item.productoId), // id del servicio real
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            subtotal: Number(item.cantidad) * Number(item.precioUnitario),
            turnoId: turno?.id ? Number(turno.id) : undefined,
          };
        } else if (servicios.some((s) => s.id === item.productoId)) {
          // Es un servicio agregado directamente
          return {
            tipo_item: "servicio",
            itemId: Number(item.productoId), // id del servicio
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            subtotal: Number(item.cantidad) * Number(item.precioUnitario),
          };
        } else {
          // Es producto
          return {
            tipo_item: "producto",
            itemId: Number(item.productoId),
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
            subtotal: Number(item.cantidad) * Number(item.precioUnitario),
          };
        }
      });

      const payload = {
        clienteId: clienteSeleccionado?.id || clienteId,
        detalles,
        metodoPago,
      };
      console.log("Payload enviado:", payload);
      console.log("Método de pago:", metodoPago);

      const res = await fetch("http://localhost:3000/facturacion/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al finalizar la factura");

      // Generar PDF de la factura
      try {
        const numeroFactura = generarFacturaPDF({
          fecha: new Date(),
          cliente: clienteSeleccionado,
          items: itemsFactura,
          metodoPago,
          total,
        });
        
        mostrarMensaje(`Factura finalizada correctamente. PDF generado: Factura_${numeroFactura}`, "exito");
      } catch (pdfError) {
        console.error("Error al generar PDF:", pdfError);
        mostrarMensaje("Factura finalizada, pero hubo un error al generar el PDF", "error");
      }

      // Limpiar todo el estado
      setItemsFactura([]);
      setMetodoPago("Efectivo");
      setClienteSeleccionado(null);
      setBusquedaCliente("");
      setMostrarDropdownClientes(false);
      setClienteBloqueado(false); // ✅ IMPORTANTE: Desbloquear cliente
      
      // ✅ Recargar turnos pendientes para refrescar la vista
      try {
        const turnosRes = await fetch("http://localhost:3000/turnos");
        if (turnosRes.ok) {
          const turnosData = await turnosRes.json();
          const pendientes = turnosData.filter((t: Turno) => t.estado === 'pendiente');
          setTurnosPendientes(pendientes);
        }
      } catch (error) {
        console.error("Error al recargar turnos:", error);
      }
    } catch (error) {
      mostrarMensaje("Error al finalizar la factura", "error");
    }
  };

  // Función para generar solo el PDF sin finalizar la factura
  const generarSoloPDF = () => {
    console.log('=== INICIANDO GENERACIÓN DE PDF ===');
    
    if (!clienteSeleccionado) {
      console.log('Error: No hay cliente seleccionado');
      mostrarMensaje("Debes seleccionar un cliente para generar el PDF.", "error");
      return;
    }

    if (itemsFactura.length === 0) {
      console.log('Error: No hay items en la factura');
      mostrarMensaje("Debes agregar al menos un producto o servicio.", "error");
      return;
    }

    console.log('Cliente seleccionado:', clienteSeleccionado);
    console.log('Items factura:', itemsFactura);
    console.log('Método de pago:', metodoPago);
    console.log('Total:', total);

    try {
      console.log('Llamando a generarFacturaPDF...');
      const numeroFactura = generarFacturaPDF({
        fecha: new Date(),
        cliente: clienteSeleccionado,
        items: itemsFactura,
        metodoPago,
        total,
      });
      
      console.log('PDF generado exitosamente, número:', numeroFactura);
      mostrarMensaje(`PDF generado correctamente: Factura_${numeroFactura}`, "exito");
    } catch (error) {
      console.error("Error detallado al generar PDF:", error);
      console.error("Stack trace:", (error as Error).stack);
      mostrarMensaje(`Error al generar el PDF: ${(error as Error).message}`, "error");
    }
  };

  // Función para obtener turnos seleccionados
  const getTurnosSeleccionados = () => {
    return itemsFactura
      .map(item => turnosPendientes.find(t => t.id === item.productoId))
      .filter(turno => turno !== undefined);
  };

  return (
    <div className="facturacion-container">
      {mensaje && (
        <div
          className={`mensaje-notificacion ${
            tipoMensaje === "error" ? "error" : "exito"
          }`}
        >
          {mensaje}
        </div>
      )}

      <h2>Sistema de Facturación</h2>

      {/* Barra de turno seleccionado */}
      {getTurnosSeleccionados().length > 0 && (
        <div className="turno-seleccionado-bar">
          {getTurnosSeleccionados().map((turno) => {
            const cliente = clientes.find(c => c.id === turno!.clienteId);
            const fechaFormateada = new Date(turno!.fecha).toLocaleDateString('es-ES');
            const horaFormateada = new Date(turno!.fecha + 'T' + (turno as any).hora || '00:00').toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={turno!.id} className="turno-info">
                <span className="turno-texto">
                  Turno seleccionado: {cliente?.nombre} {cliente?.apellido} - {fechaFormateada} {horaFormateada}
                </span>
                <button 
                  className="remover-turno-btn"
                  onClick={() => eliminarProducto(turno!.id)}
                  title="Remover turno de la factura"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="paneles">
        {/* Panel de turnos pendientes (ahora ocupará toda la anchura) */}
        <div className="panel-turnos">
          <h3>Turnos Pendientes de Cobro</h3>
          <div>
            {turnosPendientes.length === 0 ? (
              <div className="vacio">No hay turnos pendientes de cobro</div>
            ) : (
              turnosPendientes.map((turno) => {
                const diasDeDemora = calcularDemora(turno.fecha);
                const colorBadge = obtenerColorBadge(diasDeDemora);

                return (
                  <div
                    key={turno.id}
                    className={`card-item ${
                      itemsFactura.some((item) => item.productoId === turno.id)
                        ? "seleccionado"
                        : ""
                    }`}
                    onClick={() => toggleTurno(turno)}
                  >
                    <div>
                     <div className="nombre-item">{clientes.find(c => c.id === turno.clienteId)?.nombre + " " + clientes.find(c => c.id === turno.clienteId)?.apellido || "Cliente desconocido"}</div>
                      <div className="precio-item">
                        {turno.servicio?.servicio || "Servicio no disponible"}
                      </div>
                      <div className="servicio-info">
                        <small>Fecha: {turno.fecha}</small>
                      </div>
                    </div>
                    <span className={`badge ${colorBadge}`}>
                      {diasDeDemora} días
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel para productos y servicios (con dos columnas) */}
        <div className="panel-productos-servicios">
          {/* Panel de servicios (ahora a la izquierda) */}
          <div className="panel">
            <h3>Servicios Disponibles</h3>
            <div className="panel-content-scroll">
              {servicios.length === 0 ? (
                <div className="vacio">No hay servicios disponibles</div>
              ) : (
                servicios.map((servicio) => (
                  <div key={servicio.id} className="card-item">
                    <div>
                      <div className="nombre-item">{servicio.servicio}</div>
                      <div className="precio-item">${servicio.precio}</div>
                      <div className="servicio-info">
                        <small>Duración: {servicio.duracion} min</small>
                      </div>
                    </div>
                    <button
                      onClick={() => agregarServicio(servicio)}
                      className="btn-agregar servicio"
                      title="Agregar servicio"
                    >
                      <FaPlus />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel de productos (ahora a la derecha) */}
          <div className="panel">
            <h3>Productos Disponibles</h3>
            <div className="panel-content-scroll">
              {productos.length === 0 ? (
                <div className="vacio">No hay productos disponibles</div>
              ) : (
                productos.map((producto) => (
                  <div key={producto.id} className="card-item">
                    <div>
                      <div className="nombre-item">{producto.nombre}</div>
                      <div className="precio-item">
                        Precio: ${producto.precio}
                      </div>
                      <div
                        className={`stock-item ${
                          calcularStockDisponible(producto.id) > 0
                            ? "stock-ok"
                            : "stock-error"
                        }`}
                      >
                        Stock: {calcularStockDisponible(producto.id)}
                        {calcularStockDisponible(producto.id) !== producto.stock && (
                          <span className="stock-original">
                            {" "} (de {producto.stock})
                          </span>
                        )}
                      </div>
                      <div className="producto-info">
                        <small>
                          {producto.categoria} - {producto.marca}
                        </small>
                      </div>
                    </div>
                    <button
                      onClick={() => agregarProducto(producto)}
                      disabled={calcularStockDisponible(producto.id) <= 0}
                      className={`btn-agregar producto ${
                        calcularStockDisponible(producto.id) <= 0
                          ? "disabled"
                          : ""
                      }`}
                      title={
                        calcularStockDisponible(producto.id) <= 0
                          ? "Sin stock"
                          : "Agregar producto"
                      }
                    >
                      <FaPlus />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de factura (sin cambios) */}
        <div className="panel">
        <div className="panel-header">
          <h3>Detalle de Factura</h3>

          {/* Búsqueda de cliente */}
          {/* Búsqueda de cliente y método de pago en la misma línea */}
          <div className="cliente-metodo-pago-row">
            {/* Búsqueda de cliente - 50% */}
            <div className="cliente-search-container">
              <label className="cliente-label">
                Cliente:
                {clienteBloqueado && (
                  <span className="cliente-bloqueado-badge">
                    (Bloqueado por turno)
                  </span>
                )}
              </label>
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder={
                    clienteBloqueado
                      ? "Cliente bloqueado por turno seleccionado"
                      : "Buscar cliente por nombre, DNI, teléfono..."
                  }
                  value={busquedaCliente}
                  onChange={(e) => {
                    if (!clienteBloqueado) {
                      setBusquedaCliente(e.target.value);
                      setMostrarDropdownClientes(true);
                    }
                  }}
                  onFocus={() =>
                    !clienteBloqueado && setMostrarDropdownClientes(true)
                  }
                  className="cliente-search-input"
                  disabled={clienteBloqueado}
                />
                {clienteSeleccionado && !clienteBloqueado && (
                  <button
                    className="clear-cliente-btn"
                    onClick={limpiarCliente}
                    title="Limpiar selección"
                  >
                    ×
                  </button>
                )}

                {/* Dropdown de clientes */}
                {!clienteBloqueado &&
                  mostrarDropdownClientes &&
                  busquedaCliente &&
                  clientesFiltrados.length > 0 && (
                    <div className="clientes-dropdown">
                      {clientesFiltrados.slice(0, 5).map((cliente) => (
                        <div
                          key={cliente.id}
                          className="cliente-option"
                          onClick={() => seleccionarCliente(cliente)}
                        >
                          <div className="cliente-info">
                            <span className="cliente-nombre">
                              {cliente.nombre} {cliente.apellido}
                            </span>
                            <span className="cliente-detalles">
                              DNI: {cliente.dni} | Tel: {cliente.telefono}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Método de pago - 50% */}
            <div className="metodo-pago-container">
              <label className="metodo-pago-label">Método de Pago:</label>
              <select
                value={metodoPago}
                onChange={(e) => {
                  console.log("Método seleccionado:", e.target.value);
                  setMetodoPago(e.target.value);
                }}
                className="metodo-pago-select"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cuenta corriente">Cuenta corriente</option>
              </select>
            </div>
          </div>

          {/* Información del cliente seleccionado */}
          {clienteSeleccionado && (
            <div className="cliente-seleccionado">
              <div className="cliente-info-card">
                <h4>
                  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                </h4>
                <p>DNI: {clienteSeleccionado.dni}</p>
                <p>Tel: {clienteSeleccionado.telefono}</p>
                <p>Email: {clienteSeleccionado.email}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="panel-content">
          {itemsFactura.length === 0 ? (
          <div className="vacio">No hay productos ni turnos agregados</div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table className="tabla-factura">
                <thead>
                  <tr>
                    <th>Producto/Servicio</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                {itemsFactura.map((item) => (
                  <tr key={item.productoId + item.nombre}>
                    <td>{item.nombre}</td>
                    <td>
                      <div className="cantidad-controls">
                        <button
                          onClick={() => decrementarCantidad(item.productoId)}
                          disabled={item.cantidad <= 1}
                          className="cantidad-btn"
                        >
                          <FaMinus size={10} />
                        </button>

                        <input
                          type="text"
                          value={item.cantidad}
                          onChange={(e) =>
                            cambiarCantidadManual(
                              item.productoId,
                              e.target.value
                            )
                          }
                          className="cantidad-input"
                        />

                        <button
                          onClick={() => incrementarCantidad(item.productoId)}
                          disabled={item.cantidad >= item.stockDisponible}
                          className="cantidad-btn"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                      <small className="stock-info">
                        {!turnosPendientes.some(
                          (t) => t.id === item.productoId
                        ) &&
                          !servicios.some((s) => s.id === item.productoId) && (
                            <>
                              max:{" "}
                              {calcularStockDisponible(item.productoId) +
                                item.cantidad}
                            </>
                          )}
                      </small>
                    </td>
                    <td>
                      <div className="precio-controls">
                        <span className="precio-simbolo">$</span>
                        <input
                          type="text"
                          value={item.precioUnitario}
                          onChange={(e) =>
                            cambiarPrecioUnitario(
                              item.productoId,
                              e.target.value
                            )
                          }
                          className="precio-input"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td>
                      <strong>${(item.cantidad * item.precioUnitario).toFixed(2)}</strong>
                    </td>
                    <td>
                      <button onClick={() => eliminarProducto(item.productoId)}>
                        <FaTrash color="red" />
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="total-bar">
              <span>Total:</span>
              <span className="total">${total.toFixed(2)}</span>
            </div>

            <div className="botones-factura">
              <button
                className="btn-generar-pdf"
                onClick={generarSoloPDF}
                disabled={!clienteSeleccionado || itemsFactura.length === 0}
                title="Generar PDF sin finalizar la factura"
              >
                <FaFilePdf /> Generar PDF
              </button>
              
              <button
                className="btn-finalizar"
                onClick={finalizarFactura}
                disabled={!clienteSeleccionado || itemsFactura.length === 0}
              >
                Finalizar Factura
              </button>
            </div>
          </>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default FacturacionTab;
