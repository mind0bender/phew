import type { SendMailOptions } from "nodemailer";

import mailer, { getMailOpts } from "~/lib/mail/mailer.server";

export interface GetVerificationHTMLOpts {
  token: string;
  to: string;
  username: string;
}

export function getVerificationHTML({
  token,
  to,
  username,
}: GetVerificationHTMLOpts): string {
  return `<div
      style="
        background-color: #cbd5e1;
        color: #000;
        font-family: monospace;
        font-size: large;
        width: 100hw;
        padding: 2rem;
        margin: 0;
        border-radius: 0.3rem;
      ">
      <div
        style="
          gap: 0.5rem;
          font-size: xx-large;
          padding: 1rem;
          font-weight: 600;
        ">
        <img
          width="40rem"
          height="40rem"
          src="https://phew.vercel.app/favicon.ico"
          alt="phew logo" />
        <span>phew</span>
      </div>
      <div style="width: 100%">
        <div
          style="
            background-color: #fff;
            padding: 4rem 2rem 4rem 2rem;
            border-radius: 0.3rem;
            text-align: center;
          ">
          <div style="width: 100%; text-align: center">
            <div>New Signup at Phew</div>
            <div>${to}</div>
          </div>
          <div style="padding: 0.5rem">
            <hr style="width: 80%" />
          </div>
          <div style="width: 100%; text-align: center">
            <div>Hi ${username},</div>
            <div style="text-align: center">
              We just need to confirm that you created an account on phew.
              <br />
              <br />
              Are you ready to gain access of your account?
              <br />
              First you need to verify
            </div>
            <a style="cursor: pointer;" href="http://phew.vercel.app/verifyme/${token}">
              <button
                style="
                  background-color: #34d399;
                  padding: 0.5rem 1rem 0.5rem 1rem;
                  margin: 2rem 1rem 2rem 1rem;
                  border: none;
                  border-radius: 0.25rem;
                  color: #fff;
                  font-weight: 800;
                  font-size: x-large;
                  cursor: pointer;
                ">
                VERIFY
              </button>
            </a>
          </div>
          <div>This button will expire in 24 hours.</div>
          <div>
            Did you not signup?
            <a
              style="color: #34d399"
              href="http://phew.vercel.app/deleteme/${token}">
              [delete]
            </a>
            your account.
          </div>
          <div style="padding-top: 2rem">
            <span>mind0bender</span> | <span>phew</span> |
            <span>avisekh.sabi</span>
          </div>
        </div>
        <div style="text-align: center; color: #334155; padding: 1rem">
          This email is sent from
          <a style="color: #34d399" href="https://phew.vercel.app/">
            phew.vercel.app
          </a>
        </div>
        <div style="text-align: center; color: #334155; padding: 1rem; font-size: small">
          This e-mail is confidential and intended solely for the use of the individual to whom they are addressed. If you have received this e-mail in error please notify <a href="mailto:phew.mind0bender@gmail.com" >mind0bender</a>.
        </div>
      </div>
    </div>`;
}

export default async function sendVerificationEmail({
  to,
  token,
  username,
}: Required<{ token: string; to: string; username: string }>): Promise<void> {
  const mailOpts: SendMailOptions = getMailOpts({
    to,
    subject: "Email verification",
    html: getVerificationHTML({ token, to, username }),
  });
  await mailer.sendMail(mailOpts);
}
