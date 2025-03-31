import axios, { AxiosError, AxiosResponse } from "axios";
import { WhoAmIResponse } from "@/pages/api/whoAmI";

export async function getUserData(): Promise<WhoAmIResponse | undefined> {
  const res = await axios.get<WhoAmIResponse>("/api/whoAmI").catch((err: AxiosError) => {
    if (err.response) {
      return err.response;
    }
  });
  return res?.data as WhoAmIResponse;
}