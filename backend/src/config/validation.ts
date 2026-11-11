import * as Joi from 'joi';

export function validate(config: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3001),
    API_BASE_URL: Joi.string().uri().default('http://localhost:3001'),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
    SMTP_HOST: Joi.string().allow('').optional(),
    SMTP_PORT: Joi.number().optional(),
    SMTP_USER: Joi.string().allow('').optional(),
    SMTP_PASS: Joi.string().allow('').optional(),
    SMTP_FROM: Joi.string().email().allow('').optional(),
    SENDGRID_API_KEY: Joi.string().allow('').optional(),
    MAILGUN_API_KEY: Joi.string().allow('').optional(),
    MAILGUN_DOMAIN: Joi.string().allow('').optional(),
    WEBHOOK_SECRET: Joi.string().allow('').optional(),
    NEXT_PUBLIC_API_URL: Joi.string().uri().allow('').optional(),
    NEXT_PUBLIC_APP_URL: Joi.string().uri().allow('').optional(),
  });

  const { error, value } = schema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
}
