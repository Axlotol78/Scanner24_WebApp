// Fetch data and generate charts
const backend_endpoint = 'https://scanner24-webapp.onrender.com'
// const backend_endpoint = 'http://localhost:3000'
async function generateCharts() {
    try {
        const user = localStorage.getItem('auth')
        if (user == null) {
            console.error('User not found')
            window.location.href = 'index.html' // Redirect to homepage
            return

        }
        const userObj = JSON.parse(user)
        const response = await fetch(backend_endpoint + '/get-emails?user_id=' + userObj.id)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        const emails = await response.json()

        // Count proportions of risk levels
        let noRiskCount = 0
        let mediumRiskCount = 0
        let highRiskCount = 0
        
        emails.forEach(email => {
            // const riskLevel = email.spam_score < 0.5 ? 'No Risk' : email.spam_score < 0.7 ? 'Medium Risk' : 'High Risk'
            let spam_chance
            for(const score of email.spam_score){
                if(score.label == 'LABEL_0'){
                    spam_chance = score.score
                }
            }
            if (spam_chance < 0.5) {
                noRiskCount++
            } else if (spam_chance < 0.82) {
                mediumRiskCount++
            } else{
                console.log(spam_chance)
                highRiskCount++
            }
        })


        // Generate pie chart
        const pieChartOptions = {
            chart: {
                type: 'pie',
            },
            series: [noRiskCount, mediumRiskCount, highRiskCount],
            labels: ['No Risk', 'Medium Risk', 'High Risk'],
        }
        const pieChart = new ApexCharts(document.querySelector("#pieChart"), pieChartOptions)
        pieChart.render()

        // Get top 3 sources of high and medium risk emails
        const highAndMediumRiskEmails = emails.filter(email => {
            return email.spam_score > 0.5
        })
        const sourcesMap = new Map()
        highAndMediumRiskEmails.forEach(email => {
            const source = email.From
            if (sourcesMap.has(source)) {
                sourcesMap.set(source, sourcesMap.get(source) + 1)
            } else {
                sourcesMap.set(source, 1)
            }
        })

        // Sort sources by count
        const sortedSources = [...sourcesMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

        // Generate bar chart
        const barChartOptions = {
            chart: {
                type: 'bar',
            },
            series: [{
                data: sortedSources.map(entry => entry[1])
            }],
            xaxis: {
                categories: sortedSources.map(entry => entry[0])
            }
        }
        const barChart = new ApexCharts(document.querySelector("#barChart"), barChartOptions)
        // barChart.render()
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
    }
}
function logout() {
    localStorage.removeItem('auth');
    window.location.href = 'index.html'; // Redirect to homepage
}
// logout-btn
document.getElementById('logout-btn').addEventListener('click', logout)


generateCharts()