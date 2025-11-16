import React from "react";

const mapContainerStyle = {
    width: "100%",
};

export default function ActiveSession() {
    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-2">Active Session</h2>
            <p>No active session found.</p>
        </div>
    );
}
