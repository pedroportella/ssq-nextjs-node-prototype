import { createYoga } from "graphql-yoga";

import { createGraphqlContext } from "../graphql/context.js";
import { schema } from "../graphql/schema.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerGraphqlRoute(app: FastifyInstance, queryable: Queryable) {
  const yoga = createYoga({
    graphqlEndpoint: "/graphql",
    landingPage: false,
    schema
  });

  app.route({
    method: ["GET", "POST", "OPTIONS"],
    url: "/graphql",
    async handler(request, reply) {
      const response = await yoga.fetch(request.url, {
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        headers: request.headers as HeadersInit,
        method: request.method
      }, createGraphqlContext({
        headers: new Headers(request.headers as HeadersInit),
        queryable
      }));

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      reply.status(response.status);

      return reply.send(response.body);
    }
  });
}
