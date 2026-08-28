import { Estimator } from "@/components/estimator/estimator";

export default function Estimate({
  searchParams,
}: {
  searchParams?: { address?: string | string[] };
}) {
  const address = Array.isArray(searchParams?.address)
    ? searchParams.address[0] ?? ""
    : searchParams?.address ?? "";

  return <Estimator initialAddress={address} />;
}
