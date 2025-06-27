import {Box, Divider, Typography} from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import type { DisputeComment } from "@/hooks/useDisputeById";

type DisputeCommentProps = {
    comment: DisputeComment;
    isLast: boolean;
};

export default function DisputeComment({ comment, isLast }: DisputeCommentProps) {
    return (
        <Box key={comment.id} sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                <Box
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        bgcolor: 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    {comment.author.firstName[0]}
                    {comment.author.lastName[0]}
                </Box>
                <Typography variant="subtitle2" mr={2}>
                    {comment.author.firstName} {comment.author.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {dayjs(comment.createdAt).format('D MMM YYYY')}
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>{comment.body}</Typography>
            {!isLast && <Divider sx={{ mt: 2 }} />}
        </Box>
    );
}
