// When deploying swagger on vercel on nodejs it does not show UI #8461
// https://github.com/swagger-api/swagger-ui/issues/8461#issuecomment-2002404091

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { itemDocs } from './itemDocs.ts';
import { salaDocs } from './salaDocs.ts';

// https://stackoverflow.com/questions/72133185/deploy-an-express-server-that-uses-express-static-to-serve-a-build-folder-to-ver

// https://github.com/vercel/ncc/issues/406

// https://github.com/scottie1984/swagger-ui-express/issues/114#issuecomment-2160925816

export const apiDocPaths = {
    ...salaDocs,
    ...itemDocs,
};

const generateOpenAPIDocs = (registry: OpenAPIRegistry) => {
	const config = {
        openapi: "3.1.0",
        info: {
            title: "Text Adventures API",
            version: "1.0",
            description: "Embarque em uma jornada onde tudo é possível! Veja o código fonte do projeto em https://github.com/erickweil/textadventures/",
            contact: {
                name: "Erick Leonardo Weil",
                email: "erick.weil@ifro.edu.br",
            },
        },
        servers: [
            {
                url: process.env.DOCS_API_URL || "Necessário configurar URL",
            },
            {
                url: "http://127.0.0.1:"+(process.env.PORT || 3000),
            }
        ]
	};

    const openApiDocsJson = new OpenApiGeneratorV31(registry.definitions).generateDocument(config);

    return {
        swaggerDefinition: openApiDocsJson,
        apis: [], // Not used but required by swagger-jsdoc
    };
};

export default generateOpenAPIDocs;