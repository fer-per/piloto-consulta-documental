import { z } from 'zod';

export const esquemaLogin = z.object({
  usuario: z
    .string({ required_error: 'El usuario es obligatorio' })
    .trim()
    .min(3, 'Ingrese su nombre de usuario o correo')
    .max(150, 'El usuario no puede exceder 150 caracteres'),
  contrasena: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'Ingrese su contraseña')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
});
