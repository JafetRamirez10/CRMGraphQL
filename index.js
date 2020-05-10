require('dotenv').config({path: 'variables.env'});
const jwt=require('jsonwebtoken');

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolver');
const conectarDB = require('./config/db');

conectarDB();



const server=new ApolloServer({
	typeDefs,
	resolvers,
	context:({req})=>{
		
		const token= req.headers['authorization'];
		if(token){
			try{

				const usuario=jwt.verify(token.replace('Bearer ',''),process.env.SECRETA);
				console.log(usuario);

				return{
					usuario
				}

			}
			catch(e){
				console.log(e);
			}
		}
	}
});

server.listen().then(({url})=>{
	console.log(`Servidor listen en la url ${url}`);
})