import type { Transporter, SentMessageInfo, SendMailOptions } from "nodemailer";

import invariant from "tiny-invariant";
import { createTransport } from "nodemailer";

invariant(process.env.MAIL_ADDR, "MAIL_ADDR is required");
invariant(process.env.MAIL_PSWD, "MAIL_PSWD is required");
const MAIL_ADDR: string = process.env.MAIL_ADDR;
const MAIL_PSWD: string = process.env.MAIL_PSWD;

const mailer: Transporter<SentMessageInfo> = createTransport({
  service: "gmail",
  auth: {
    user: MAIL_ADDR,
    pass: MAIL_PSWD,
  },
});

try {
  mailer.verify();
  console.log(`mail transporter verified`);
} catch (error) {
  console.error(`mail transporter failed`);
  console.error(error);
}

export type GetMailOptsArgs = Required<
  Pick<SendMailOptions, "subject" | "to">
> &
  Pick<SendMailOptions, "html" | "attachments" | "text">;

export function getMailOpts({
  subject,
  html,
  attachments,
  to,
  text,
}: GetMailOptsArgs): SendMailOptions {
  const mailConfiguratoin: SendMailOptions = {
    from: {
      name: "phew",
      address: MAIL_ADDR,
    },
    subject,
    html,
    attachments,
    to,
    text,
  };
  return mailConfiguratoin;
}
export default mailer;
