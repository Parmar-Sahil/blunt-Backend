export const swaggerConfig = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BLUNT E-commerce Engine API Documentation",
      version: "1.0.0",
      description: "Enterprise-grade API architecture logs and specs for BLUNT luxury streetwear",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export default swaggerConfig;
