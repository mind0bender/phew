import invariant from "tiny-invariant";
import { pbkdf2, randomBytes } from "crypto";

export interface HashedPassword {
  hash: string;
  salt: string;
}

export default class Password {
  private password: string;
  private salt: string | null;
  private static iterations: number = 1000;

  private static generateSalt(): string {
    const salt: string = randomBytes(16).toString("hex");
    return salt;
  }

  constructor(password: string, salt: string = Password.generateSalt()) {
    this.password = password;
    this.salt = salt;
  }
  hash(): Promise<HashedPassword> {
    return new Promise<HashedPassword>(
      (
        resolve: (value: HashedPassword) => void,
        reject: (reason?: any) => void
      ): void => {
        invariant(this.salt, "generate salt first");
        const salt: string = this.salt;
        pbkdf2(
          this.password,
          salt,
          Password.iterations,
          64,
          "sha512",
          (err: Error | null, hashBuffer: Buffer): void => {
            const hash: string = hashBuffer.toString("hex");
            if (err) {
              reject(err);
            } else {
              resolve({
                hash,
                salt,
              });
            }
          }
        );
      }
    );
  }
  async compare(hashFromDB: string): Promise<boolean> {
    try {
      const { hash } = await this.hash();
      return hash === hashFromDB;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
