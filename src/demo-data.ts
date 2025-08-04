// Demo data generator for testing mood trends
export const generateDemoMoodData = () => {
  const demoData = [];
  const now = new Date();
  
  // Generate 21 days of sample mood data
  for (let i = 20; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Add 1-3 entries per day with varied timing
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < entriesPerDay; j++) {
      const entryTime = new Date(date);
      entryTime.setHours(Math.floor(Math.random() * 16) + 6); // 6 AM to 10 PM
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      // Generate realistic mood patterns
      let mood: number;
      
      // Weekend boost
      const isWeekend = entryTime.getDay() === 0 || entryTime.getDay() === 6;
      
      // Time of day effect
      const hour = entryTime.getHours();
      const isMorning = hour < 12;
      const isEvening = hour > 18;
      
      // Base mood with realistic variation
      let baseMood = 3; // neutral starting point
      
      if (isWeekend) baseMood += 0.3;
      if (isMorning) baseMood += 0.2;
      if (isEvening) baseMood -= 0.1;
      
      // Add some random variation and trends
      const trendFactor = (20 - i) * 0.05; // slight upward trend over time
      const randomVariation = (Math.random() - 0.5) * 2; // ±1 variation
      
      mood = Math.round(Math.max(1, Math.min(5, baseMood + trendFactor + randomVariation)));
      
      demoData.push({
        id: `demo-mood-${entryTime.getTime()}-${j}`,
        level: mood,
        timestamp: entryTime
      });
    }
  }
  
  return demoData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateDemoDiaryData = () => {
  const topics = [
    { title: "Morning Reflection", content: "Started the day with meditation and felt really centered. The sunrise was beautiful and it set a peaceful tone for the entire day." },
    { title: "Work Challenges", content: "Had a tough meeting today but managed to present my ideas clearly. Feeling proud of how I handled the pressure and stayed calm." },
    { title: "Evening Gratitude", content: "Grateful for good friends and meaningful conversations. Sometimes the simple moments are the most valuable." },
    { title: "Weekend Adventures", content: "Went hiking and felt so connected to nature. There's something magical about being outdoors and disconnecting from technology." },
    { title: "Learning Journey", content: "Reading has been really fulfilling lately. Each book opens up new perspectives and ways of thinking about the world." },
    { title: "Family Time", content: "Spent quality time with family today. These moments remind me what truly matters in life." },
    { title: "Creative Flow", content: "Had an amazing creative session today. When inspiration strikes, everything just flows naturally and beautifully." },
    { title: "Quiet Moments", content: "Sometimes the best days are the quiet ones where you can just be present and appreciate the simple things around you." }
  ];
  
  const tags = ["gratitude", "growth", "nature", "creativity", "family", "mindfulness", "work", "learning", "reflection"];
  
  const demoData = [];
  const now = new Date();
  
  // Generate 8-12 diary entries over the past 3 weeks
  const numEntries = Math.floor(Math.random() * 5) + 8;
  
  for (let i = 0; i < numEntries; i++) {
    const daysAgo = Math.floor(Math.random() * 21);
    const entryDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    entryDate.setHours(Math.floor(Math.random() * 6) + 18); // Evening entries
    
    const topicIndex = Math.floor(Math.random() * topics.length);
    const topic = topics[topicIndex];
    
    // Select 1-3 random tags
    const numTags = Math.floor(Math.random() * 3) + 1;
    const selectedTags = [];
    for (let j = 0; j < numTags; j++) {
      const tagIndex = Math.floor(Math.random() * tags.length);
      if (!selectedTags.includes(tags[tagIndex])) {
        selectedTags.push(tags[tagIndex]);
      }
    }
    
    // Mood correlates with content sentiment
    const mood = Math.floor(Math.random() * 2) + 3 + (topic.content.includes("amazing") || topic.content.includes("beautiful") || topic.content.includes("grateful") ? 1 : 0);
    
    demoData.push({
      id: `demo-diary-${entryDate.getTime()}`,
      title: topic.title,
      content: topic.content,
      mood: Math.min(5, mood),
      tags: selectedTags,
      timestamp: entryDate
    });
  }
  
  return demoData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};