import Link from "next/link";
import { Typography } from "@mui/material";

type HomeProps = {
    params: {
        locale: string;
    };
};

export default function Home({ params: { locale } }: HomeProps) {
    const loginHref = `/${locale}/auth/login`;

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
