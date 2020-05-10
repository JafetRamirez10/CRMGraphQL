const Usuario = require('../models/usuarios');
const Producto = require('../models/producto');
const Cliente = require('../models/cliente');

const bcryptjs = require('bcryptjs');
const jwt= require('jsonwebtoken');
require('dotenv').config({path:'variables.env'});

const crearToken=(usuario,secreta,expiresIn)=>{
    
    const {id,email,nombre,apellido}=usuario;
    return jwt.sign({id,email,nombre,apellido},secreta,{ expiresIn });

}


const resolvers = {
	Query:{
		obtenerUsuario: async(_,{},ctx)=>{
            
            return ctx.usuario;
        },
        obtenerProductos: async()=>{
            try{
                const productos = await Producto.find({});
                return productos;

            }catch(error){
                console.log(error);
            }
        },
        obtenerProducto:async(_,{id})=>{
            // revisar si el producto existe o no
            const producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado');
            }
            return producto;
        },
          obtenerClientes:async()=>{
                try{

                    const clientes= await Cliente.find();
                    return clientes;

                }catch(e){
                    console.log(e);
                }
            },
        obtenerClientesVendedor:async(_,{},ctx)=>{
            const cliente = await Cliente.find({vendedor:ctx.usuario.id});
            if(!cliente){
                throw error('Cliente no fue encontrado');
            }
            return cliente;
        },
        obtenerCliente:async(_,{id},ctx)=>{
            try{
            const cliente = await Cliente.findById(id);
            if(!cliente){
                throw  new Error('Cliente no fue encontrado');
            }
            if(cliente.vendedor.toString()!==ctx.usuario.id){
                throw new Error('No tienes credenciales');
            }

            return cliente;
            }catch(e){
                console.log(e);
            }
        },
        obtenerPedidos:async(_,{},ctx)=>{
            try{

                const pedidos = await Pedido.find({});
                return pedidos;
            }
            catch(e){
                console.log(e);
            }
        },
        obtenerPedidosVendedor:async(_,{},ctx)=>{
            try{
                const pedidos=await Pedido.find({vendedor:ctx.usuario.id});
                return pedidos;

            }catch(e){
                console.log(e);
            }
        },
        obtenerPedido:async(_,{id},ctx)=>{
            const pedido=await Pedido.findById(id);
            if(!pedido){

                throw new Error('Pedido no encontrado');
            }
            if(pedido.vendedor.toString()!==ctx.usuario.id){
                throw new Error('No tienes credenciales');
            }


            return pedido;
        },
        obtenerPedidosEstado:async(_,{ estado },ctx)=>{
            const pedidos =  await Pedido.find({vendedor:ctx.usuario.id,estado});
            return pedidos;
        },
        mejoresClientes:async()=>{
            const clientes = await Pedido.aggregate([
                    { $match : {estado:"COMPLETADO"}},
                    {$group:{
                        _id : "$clientes",
                        total:{$sum : '$total'}
                    }},
                    {
                        $lookup:{
                            from:'cliente',
                            localField:'_id',
                            foreignField:'_id',
                            as :"cliente"
                        },

                        $sort:{ total : -1}
                    }
                ]);

            return clientes;
        },

        mejoresVendedores:async()=>{
            const vendedores = await Pedido.aggregate([
                 {$match : {estado :"COMPLETADO"}},
                 {$group:{
                    _id:"$vendedor",
                    total:{$sum:'$total'}
                 }},
                 {
                    $lookup:{
                        from : 'usuarios',
                        localField:'_id',
                        foreignField:'_id',
                        as:'vendedor'
                    }
                },
                    {
                        $limit : 5
                    },
                    {
                        $sort : { total : -1}
                    }
                 
                ]);

            return vendedores;
        },
        buscarProducto:async(_,{texto})=>{
            const productos = await Producto.find({$text:{$search:texto}}).limit(10);
            return productos;
        }

	},
    Mutation:{
        nuevoUsuario:async(_,{input})=>{
           
            const {email,password}=input;
            const existeUsuario= await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error('El usuario ya esta registrado');
            }

                const salt = await bcryptjs.genSaltSync(10);
                input.password= await bcryptjs.hash(input.password,salt);

            try{
                    const usuario= new Usuario(input);
                    usuario.save();
                    return usuario;

            }catch(e){
                console.log(e);
            }
        },
        autenticarUsuario:async(_,{input})=>{
            // Si el usuario existe
            const {email,password}=input;
            const existeUsuario=await Usuario.findOne({email});
            if(!existeUsuario){
                throw new Error('El usuario no existe');
            }

            // Revisar si el password es correcto
             const passwordCorrecto = await bcryptjs.compare(password,existeUsuario.password);
             if(!passwordCorrecto){

                throw new Error('El usuario no existe');
             }
             // Crear el token
             return{
                token: crearToken(existeUsuario,process.env.SECRETA,'24h')
             }


        },
        nuevoProducto:async(_,{input})=>{
            try{
                const producto = new Producto(input);
                // almacenar en la base de datos

                const resultado= await producto.save();
                return resultado;
            }catch(e){
                console.log(e);
            }
        },
         actualizarProducto:async(_,{id,input})=>{

          let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado');
            }
            producto = await Producto.findOneAndUpdate({_id:id},input,{new:true});

            return producto;
        },
        eliminarProducto:async(_,{id})=>{
            let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado');
            }
            // Eliminar
            await Producto.findOneAndDelete({_id:id});
            return "Producto Eliminado";
        },
        nuevoCliente:async(_,{input},ctx)=>{
            const {email} = input;
            const cliente= await Cliente.findOne({email});
            if(cliente){
                throw new Error('Ese cliente ya esta registrado');
            }



            const nuevoCliente=new Cliente(input);
            nuevoCliente.vendedor=ctx.usuario.id;
            const resultado=await nuevoCliente.save();
            return resultado;

        },
        actualizarCliente:async(_,{id,input},ctx)=>{
            let cliente = await Cliente.findById(id);
            if(!cliente){
                   throw new Error('Ese cliente no esta registrado');
            }
            if(cliente.vendedor.toString()!==ctx.usuario.id){
                 throw new Error('No tienes credenciales');   
            }
            clienteUpdate= await Cliente.findOneAndUpdate({_id:id},input,{new:true});
           return clienteUpdate;
        },
        eliminarCliente:async(_,{id},ctx)=>{
            let cliente= await cliente.findById(id);
            if(!cliente){
                 throw new Error("Ese cliente no existe");
            }
            if(cliente.vendedor.toString()!==ctx.usuario.id){
                throw new Error('Cliente Eliminado');
            }
            await Cliente.findOneAndDelete({_id:id});
            return "Cliente eliminado";
        },
        nuevoPedido:async(_,{input},ctx)=>{
            const{ cliente } = input;
            let clienteExiste= await Cliente.findById(cliente);
            if(!clienteExiste){
                throw new Error('Ese cliente no existe');
            }
            if(clienteExiste.vendedor.toString()!=ctx.usuario.id){

                throw new Error('No tienes credenciales');
                for await(const articulo of input.pedido){
                    const {id}=articulo;
                    const producto=await Producto.findById(id);
                    if(articulo.cantidad>producto.existencia){
                        throw new Error(`El articulo del ${producto.nombre} excede la cantidad disponible`);


                }else{
                    producto.existencia=producto.existencia-articulo.cantidad;
                    await producto.save();
                }

                const nuevoPedido= new Pedido(input);
                nuevoPedido.vendedor=ctx.usuario.id;
                const resultado=await nuevoPedido.save();
                return resultado;
            }
        }  
    },
    actualizarPedido:async(_,{id,input},ctx)=>{
        const existePedido = await Pedido.findById(id);
        const {cliente}=input;
        if(!existePedido){
            
            throw new Error('El pedido no existe');
        }

        const existeCliente = await Cliente.findById(cliente);
        if(!existeCliente){

                throw new Error('El pedido no existe');
        }

        if(existeCliente.vendedor.toString()!==ctx.usuario.id){

            throw new Error('No tienes credenciales');
        }

        for await (const articulo of input.pedido){
            const {id} = articulo;
            const producto = await Producto.findById(id);
            if(articulo.cantidad>producto.existencia){
                throw new Error(`El articulo: ${producto.nombre}`);
            }else{
                producto.existencia = producto.existencia-articulo.cantiad;
                await producto.save();
            }
        }

        //Guardar el pedido
        const resultado = await Pedido.findOneAndUpdate({_id:id},input,{new:true});
        return resultado;

    },
    eliminarPedido:async(_,{id},ctx)=>{
        const pedido = await Pedido.findById(id);
        if(!pedido){
            throw new Error('El pedido no existe');
        }

        if(pedido.vendedor.toString()!==ctx.usuario.id){
            throw new Error('No tienes las credenciales');
        }

        await Pedido.findOneAndDelete({_id:id});
        return "Producto eliminado";
    }
}
}


module.exports = resolvers;