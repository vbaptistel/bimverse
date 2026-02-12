import { redirect } from "next/navigation";

export default function NewProposalPage() {
  redirect("/propostas?new=1");
}
