const { gql } = require('apollo-server');
const typeDefs
 = gql`
 	type Usuario{
 		id:ID
 		nombre:String
 		apellido:String
 		email:String
 	}
 	type Token{
 		token:String
 	}

 	type  Producto{
 		id:ID
 		nombre:String
 		existencia:Int
 		precio:Float
 		creado:String
 	}	
	type  Curso{
		titulo:String
		tecnologia:String

	}
	type TopCliente{
		total:Float
		cliente:[Cliente]
	}
	type TopVendedor{
		total:Float
		vendedor:[Usuario]
	}
	enum EstadoPedido{
		PENDIENTE
		COMPLETADO
		CANCELADO
	}

	type Cliente{
		id:ID
		nombre:String
		empresa:String
		email:String
		telefono:String
		vendedor:ID
	}
	
	type PedidoGrupo{
		id:ID
		cantidad:Int
	}
	type Pedido{
		
		id:ID
		pedido:[PedidoGrupo]
		total:Float
		cliente:ID
		vendedor:ID
		fecha:String
		estado:EstadoPedido
		
	}

	input UsuarioInput{
		nombre:String!
		apellido:String!
		email:String!
		password:String!
	}
	input AutenticarInput{
		email:String!
		password:String!
	}

	input CursoInput{

		tecnologia:String		
	}

	input ProductoInput{
		nombre:String!
		existencia:Int!
		precio:Float!


	}

	input ClienteInput {
		nombre:String!,
		apellido:String!,
		empresa:String!,
		email:String!,
		telefono:String
	}

	input PedidoInput{
		pedido:[PedidoProductoInput]
		total:Float!
		cliente:ID!
		estado:EstadoPedido

	}
	

	input PedidoProductoInput{
		id:ID
		cantidad:Int

	}

	type Query{

		obtenerUsuario: Usuario
        obtenerProductos:[Producto]
        obtenerProducto(id:ID!) : Producto

        #Clientes
        obtenerClientes:[Cliente]
        obtenerClientesVendedor:[Cliente]
        obtenerCliente(id:ID!):Cliente

        #Pedido
        obtenerPedidos:[Pedido]
        obtenerPedidosVendedor:[Pedido]
        obtenerPedido(id:ID!):Pedido
        obtenerPedidosEstado(estado:String!):[Pedido]

        # Busquedas Avanzadas
        mejoresClientes:[TopCliente]
        mejoresVendedores:[TopVendedor]
        buscarProducto(texto:String!) : [Producto]

	}

	type Mutation{

		# Usuarios
		nuevoUsuario(input:UsuarioInput):Usuario
		autenticarUsuario(input:AutenticarInput): Token
		actualizarProducto(id:ID!,input:ProductoInput ): Producto
		eliminarProducto(id: ID!): String

		# Productos
		nuevoProducto(input:ProductoInput) : Producto

		# Pedido
		nuevoPedido(input:PedidoInput):String
		actualizarPedido(id:ID!,input:PedidoInput):Pedido
		eliminarPedido(id:ID!):String

		# Clientes
		nuevoCliente(input:ClienteInput) : Cliente
		actualizarCliente(id:ID!,input:ClienteInput):Cliente
		eliminarCliente(id:ID!):String

	}
`;
module.exports = typeDefs;