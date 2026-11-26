import { migrateDatabase } from "./migrate-db";
import { defaultSlaPolicies } from "../shared/utils/sla";
import { notifyRequest } from "../server/repositories/notifications";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { pool } from "../server/utils/database";
import { hashPassword } from "../server/utils/password";
import { createApiCatalogs, createApiSeed } from "../server/utils/seed";
import type { Role } from "../shared/types/auth";

export const demoPassword = "Practice123!";
export async function initializeDatabase(target: Pool = pool) {
  await target.query(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  await migrateDatabase(target);
  const client = await target.connect();
  try {
    await client.query("BEGIN");
    for (const policy of defaultSlaPolicies)
      await client.query(
        "INSERT INTO sla_policies(priority,response_minutes,resolution_minutes) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [policy.priority, policy.response_minutes, policy.resolution_minutes],
      );
    const catalogs = createApiCatalogs();
    for (const item of catalogs.customers)
      await client.query(
        "INSERT INTO customers(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [item.id, item.name],
      );
    for (const item of catalogs.categories)
      await client.query(
        "INSERT INTO categories(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [item.id, item.name],
      );
    const people: {
      id: string;
      name: string;
      email: string;
      role: Role;
      customer: string | null;
      active: boolean;
    }[] = [
      {
        id: "user-1",
        name: "Анна Кузнецова",
        email: "operator@workflow.local",
        role: "Operator",
        customer: null,
        active: true,
      },
      {
        id: "user-2",
        name: "Мария Смирнова",
        email: "client@workflow.local",
        role: "Client",
        customer: "customer-1",
        active: true,
      },
      {
        id: "user-3",
        name: "Брунгильда Брунгильдовна",
        email: "agent@workflow.local",
        role: "Agent",
        customer: null,
        active: true,
      },
      {
        id: "user-4",
        name: "Олег Соколов",
        email: "inactive@workflow.local",
        role: "Agent",
        customer: null,
        active: false,
      },
      {
        id: "user-5",
        name: "Александра Константиновна Рождественская-Соколова",
        email: "agent2@workflow.local",
        role: "Agent",
        customer: null,
        active: true,
      },
      {
        id: "user-6",
        name: "Администратор",
        email: "admin@workflow.local",
        role: "Admin",
        customer: null,
        active: true,
      },
      {
        id: "user-7",
        name: "Иван Петров",
        email: "client2@workflow.local",
        role: "Client",
        customer: "customer-2",
        active: true,
      },
      {
        id: "user-8",
        name: "Дмитрий Волков",
        email: "client3@workflow.local",
        role: "Client",
        customer: "customer-3",
        active: true,
      },
    ];
    for (const person of people)
      await client.query(
        "INSERT INTO users(id,name,email,password_hash,role,customer_id,is_active) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
        [
          person.id,
          person.name,
          person.email,
          await hashPassword(demoPassword),
          person.role,
          person.customer,
          person.active,
        ],
      );
    for (const item of createApiSeed()) {
      const author =
        item.customer_id === "customer-1"
          ? "user-2"
          : item.customer_id === "customer-2"
            ? "user-7"
            : "user-8";
      const initial = item.id === 1042,
        status = initial ? "new" : item.status;
      const assignee = initial
        ? null
        : item.id === 1035
          ? "user-5"
          : item.assignee_id;
      const inserted = await client.query(
        "INSERT INTO requests(id,title,description,status,priority,customer_id,category_id,author_id,assignee_id,created_at,due_at,resolution,waiting_reason,closing_reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING RETURNING id",
        [
          item.id,
          item.title,
          (item.description?.length ?? 0) >= 10
            ? item.description
            : `Обращение: ${item.description ?? item.title}`,
          status,
          item.priority,
          item.customer_id,
          item.category_id,
          author,
          assignee,
          item.created_at,
          item.due_at,
          status === "resolved" ? "Работы по заявке выполнены." : null,
          status === "waiting" ? "Ожидается ответ клиента." : null,
          status === "closed" ? "Заявка закрыта после проверки." : null,
        ],
      );
      if (!inserted.rowCount) continue;
      for (const comment of (initial
        ? item.comments?.slice(0, 1)
        : item.comments) ?? [])
        await client.query(
          "INSERT INTO comments(id,request_id,author_id,text,created_at) VALUES($1,$2,$3,$4,$5)",
          [
            randomUUID(),
            item.id,
            comment.author_id ?? author,
            comment.text,
            comment.created_at,
          ],
        );
      for (const event of (initial
        ? item.timeline?.slice(0, 1)
        : item.timeline) ?? [])
        await client.query(
          "INSERT INTO request_events(id,request_id,actor_id,title,description,kind,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            randomUUID(),
            item.id,
            author,
            event.title,
            event.description ?? "",
            event.kind,
            event.created_at,
          ],
        );
    }
    await client.query(
      `UPDATE requests r SET response_due_at=r.created_at+p.response_minutes*interval '1 minute',responded_at=CASE WHEN r.assignee_id IS NOT NULL OR r.status NOT IN ('new') THEN r.created_at+interval '5 minutes' ELSE NULL END,resolved_at=CASE WHEN r.status='resolved' THEN r.created_at+interval '2 hours' ELSE NULL END,closed_at=CASE WHEN r.status='closed' THEN r.created_at+interval '2 hours' ELSE NULL END FROM sla_policies p WHERE p.priority=r.priority AND r.response_due_at IS NULL`,
    );
    for (const demo of [
      {
        id: 1018,
        title: "Проверить доступ к сервису оплаты",
        status: "escalated",
        minutes: 180,
        agent: "user-3",
        reason: "Требуется помощь старшего специалиста",
      },
      {
        id: 1017,
        title: "Проверить интеграцию с телефонией",
        status: "in_progress",
        minutes: 220,
        agent: "user-5",
        reason: null,
      },
    ]) {
      const inserted = await client.query(
        `INSERT INTO requests(id,title,description,status,priority,customer_id,category_id,author_id,assignee_id,created_at,due_at,response_due_at,responded_at,escalation_reason) VALUES($1,$2,'Требуется дополнительная проверка работы сервиса.',$3,'high','customer-1','category-1','user-2',$4,now()-$5*interval '1 minute',now()+(240-$5)*interval '1 minute',now()+(60-$5)*interval '1 minute',now()-($5-5)*interval '1 minute',$6) ON CONFLICT DO NOTHING RETURNING id`,
        [
          demo.id,
          demo.title,
          demo.status,
          demo.agent,
          demo.minutes,
          demo.reason,
        ],
      );
      if (inserted.rowCount && demo.status === "escalated")
        await notifyRequest(
          client,
          { id: demo.id, author_id: "user-2", assignee_id: demo.agent },
          "escalation",
          "Заявка эскалирована",
          `#${demo.id} · ${demo.reason}`,
          `seed-escalation:${demo.id}`,
        );
    }
    for (const status of ["assigned", "resolved", "closed"]) {
      const record = (
        await client.query<{
          id: number;
          title: string;
          author_id: string;
          assignee_id: string | null;
        }>(
          "SELECT id,title,author_id,assignee_id FROM requests WHERE status=$1 ORDER BY id DESC LIMIT 1",
          [status],
        )
      ).rows[0];
      if (record)
        await notifyRequest(
          client,
          record,
          status === "assigned" ? "assignment" : "status",
          status === "assigned"
            ? "Назначен исполнитель"
            : status === "resolved"
              ? "Исполнитель зафиксировал решение"
              : "Заявка закрыта",
          `#${record.id} · ${record.title}`,
          `seed:${status}:${record.id}`,
        );
    }
    await client.query(
      "SELECT setval(pg_get_serial_sequence('requests','id'),GREATEST(1043,(SELECT COALESCE(max(id),1043) FROM requests)))",
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/init-db.ts")) {
  try {
    await initializeDatabase();
    console.log("Database schema and seed are ready");
  } finally {
    await pool.end();
  }
}
