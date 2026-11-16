import QueryProviders from "@/util/QueryProviders";
import { Suspense } from "react";
import Loading from "@/components/Loader/loading";

export default function RootLayout({ children }) {
    return (
        <div>
            <QueryProviders>
                <Suspense fallback={<Loading />}>
                    {children}
                </Suspense>
            </QueryProviders>
        </div>
    );
}
