import Link from "next/link";
import { Typography } from "@mui/material";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const loginHref = `/${locale}/auth/login`;

    console.log("🚀 Frontend deployment test - Auto-deploy working!");

    return (
        <div className="grid  items-center justify-items-center p-8 pb-20 gap-16">
            <div>
                <Link href={loginHref} style={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant={"h4"} gutterBottom sx={{ cursor: "pointer" }}>
                        Welcome to VervoerManager
                </Typography>
                </Link>
            </div>
        </div>
    );
}
