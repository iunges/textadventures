import { type RequestHandler, type Express, type ErrorRequestHandler } from "express";
import { getDocsRouter } from "./docsRoute.ts";
import { logMiddleware } from "./logMiddleware.ts";
import { getItemRouter } from "./itemRoute.ts";
import { getSalaRouter } from "./salaRoute.ts";

const routes = (app: Express) => {
	// Só fazer log das rotas se estiver em desenvolvimento, desativar em produção
	if(process.env.DEBUGLOG === "true") {
		app.use(logMiddleware);
	}

    app.use(
        getItemRouter(),
        getSalaRouter(),
        getDocsRouter(),
    );

	app.post("/cookie", (req, res) => {
		const value = req.body.cookie;
		if(!value) {
			res.status(400).json({ error: "Cookie value is required" });
			return;
		}

		res.setHeader('Set-Cookie', value);
		res.status(200).json({ 
			headers: JSON.parse(JSON.stringify(req.headers,null,2)),
		});
	})

	app.use((req,res,next) => {
		res.sendStatus(404);
	});

	// Por último o middleware de tratamento de erros
	app.use(((error, req, res, next) => {
        console.error(error);
		if(!res.headersSent) {
			res.status(500).json({ error: "Erro interno do servidor", message: error.message });
		}
    }) as ErrorRequestHandler);
};

export default routes;