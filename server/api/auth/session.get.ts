import { defineEventHandler } from "h3";
export default defineEventHandler((event) => ({ user: event.context.user }));
