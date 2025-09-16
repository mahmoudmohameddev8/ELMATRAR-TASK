import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./DB/connection.js"
import authRouter from "./src/moudels/auth/auth.router.js"
import transactionsRouter from "./src/moudels/transactions/transactions.router.js"
import { startExpireScheduler } from "./src/moudels/transactions/expire.worker.js"
dotenv.config()

const app = express()
const port = process.env.PORT

app.use(express.json())


await connectDB()

startExpireScheduler();


app.use("/auth", authRouter)
app.use("/transactions", transactionsRouter)





app.use((req, res, next) => {
    res.status(404).json({ message: "page not found" })
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500
    return res.status(statusCode).json({ success: false, message: error.message, stack: error.stack })
})

app.listen(port, () => console.log("app is running at port:", port))