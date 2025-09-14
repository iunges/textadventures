import { RequestHandler, Express, ErrorRequestHandler } from "express";
import { getDocsRouter } from "./docsRoute.ts";
import { getCommandRouter } from "./commandRoute.ts";

export const logRoutes: RequestHandler = (req,res,next) => {
	const timestamp = new Date().toISOString();

	let ip = req.headers["x-forwarded-for"] ||
	req.socket.remoteAddress ||
	null;

	console.log(timestamp+" "+ip+" "+req.protocol + "://" + req.get("host") + " " + req.method + " " + req.originalUrl);
	// Log Headers
	//console.log(JSON.stringify(req.headers));
	next();
};

const routes = (app: Express) => {

	// Só fazer log das rotas se estiver em desenvolvimento, desativar em produção
	if(process.env.DEBUGLOG === "true") {
		app.use(logRoutes);
	}

    app.use(
        getDocsRouter(),
        getCommandRouter()
    );

	app.use((req,res,next) => {
		res.sendStatus(404);
	});

	// Por último o middleware de tratamento de erros
	app.use(((error, req, res, next) => {
        console.error(error);
		if(!res.headersSent) {
			res.status(500).json({ error: "Internal Server Error", message: error.message });
		}
    }) as ErrorRequestHandler);
};

export default routes;