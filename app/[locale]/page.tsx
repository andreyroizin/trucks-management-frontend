import Link from 'next/link';
import {Button, Typography} from "@mui/material";

export default function Home() {
    return (
        <div className="grid  items-center justify-items-center p-8 pb-20 gap-16">
            <div>
                <Typography variant={"h4"} gutterBottom>
                    Hello, welcome to the home page!
                </Typography>
                <Link href="/auth/login">
                    <Button className="" variant={"outlined"}>
                        You can login here
                    </Button>
                </Link>
            </div>
        </div>
    );
}
