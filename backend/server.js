
const express = require("express")
const { exec } = require("child_process")

const app = express()
const PORT = 3001

app.get("/vpn-status", (req, res) => {
  exec("tasklist", (error, stdout) => {
    if (error) return res.json({ connected: false })

    const isRunning = stdout.includes("RadminVPN.exe")
    res.json({ connected: isRunning })
  })
})

app.listen(PORT, () => {
  console.log(`VPN monitor running at http://localhost:${PORT}`)
})
