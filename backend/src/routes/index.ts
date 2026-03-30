import { Router, type Express, type ErrorRequestHandler } from "express";
import { getDocsRouter } from "./docsRoute.ts";
import { logMiddleware } from "./logMiddleware.ts";
import { authMiddleware, COOKIE_NAME, COOKIE_OPTIONS, RevokeSessionError } from "../middlewares/authMiddleware.ts";
import { AuthController } from "../controllers/authController.ts";
import { SalaController } from "../controllers/salaController.ts";
import { EntidadeController } from "../controllers/entidadeController.ts";
import { ItemController } from "../controllers/itemController.ts";
import { JogoError } from "../jogo/types.ts";
import { TextoController } from "../controllers/textoController.ts";

const routes = (app: Express) => {
	// Só fazer log das rotas se estiver em desenvolvimento, desativar em produção
	if(process.env.DEBUGLOG === "true") {
		app.use(logMiddleware);
	}

	const router = Router();

	router.post("/auth/cadastrar", AuthController.cadastrar);
	router.post("/auth/login", AuthController.login);
	router.post("/auth/logout", AuthController.logout);
	router.get("/auth/info", authMiddleware, AuthController.info);

	router.get( "/sala/:salaId/olhar", authMiddleware, SalaController.descreverSalaAtual);
	router.post("/sala/:salaId/item/:id/:acao", authMiddleware, ItemController.acaoItem);
	router.post("/sala/:salaId/entidade/:id/:acao", authMiddleware, EntidadeController.acaoEntidade);
	router.post("/sala/:salaId/:acao", authMiddleware, SalaController.executarAcao);

	router.post("/texto", authMiddleware, TextoController.processarTexto);
	router.get("/texto", authMiddleware, TextoController.processarTexto);


    app.use(
        getDocsRouter(),
		router,
    );

	app.use((req,res,next) => {
		res.sendStatus(404);
	});

	// Por último o middleware de tratamento de erros
	app.use(((error, req, res, next) => {
        console.error(error);

		if(error instanceof JogoError) {
			res.status(400).json({ ok: true, message: error.message });
		}

		if(error instanceof RevokeSessionError) {
			res.status(error.message === "OK" ? 200 : 401)
				.clearCookie(COOKIE_NAME, COOKIE_OPTIONS)
				.json({ message: "Sessão inválida ou expirada" });
			return;
		}

		if(!res.headersSent) {
			res.status(500).json({ error: "Erro interno do servidor", message: error.message });
		}
    }) as ErrorRequestHandler);
};

export default routes;