// Add this import to the existing Express server entrypoint.
import analysisRouter from "./routes/analysis.routes";

// Make sure JSON parsing is registered before the route.
app.use(express.json());

// Mount the financial engine API.
app.use("/api/analysis", analysisRouter);
