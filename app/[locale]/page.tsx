import { Typography } from "@mui/material";

export default function Home() {
    return (
        <div className="grid  items-center justify-items-center p-8 pb-20 gap-16">
            <div>
                <Typography variant={"h4"} gutterBottom>
                    Welcome to VervoerManager
                </Typography>
            </div>
        </div>
    );
}
