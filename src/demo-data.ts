// Demo data generator for testing mood trends
export const generateDemoMoodData = () => {
  const now = new Date();
  const demoData = [];
  
  // Generate mood entries for the past 21 days
  for (let i = 0; i < 21; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Add 1-3 entries per day with varied timing
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < entriesPerDay; j++) {
      const entryTime = new Date(date);
      entryTime.setHours(Math.floor(Math.random() * 16) + 6); // 6 AM to 10 PM
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      // Generate mood with some realistic patterns
      let mood = 3; // Start neutral
      
      // Weekend boost
      if (entryTime.getDay() === 0 || entryTime.getDay() === 6) {
        mood += Math.random() > 0.3 ? 1 : 0;
      }
      
      // Evening dip
      if (entryTime.getHours() > 20) {
        mood -= Math.random() > 0.4 ? 1 : 0;
      }
      
      // Random variation
      mood += Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      
      // Clamp to 1-5 range
      mood = Math.max(1, Math.min(5, mood));
      
      demoData.push({
        id: `demo-mood-${i}-${j}-${Date.now()}`,
        level: mood,
        timestamp: entryTime
      });
    }
  }
  
  return demoData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateDemoDiaryData = () => {
  const topics = [
    { title: "Morning Reflection", content: "Started the day with some quiet time to myself. There's something peaceful about the early morning hours that helps me center my thoughts and set intentions for the day ahead." },
    { title: "Gratitude Practice", content: "Taking time to appreciate the small things today. The way sunlight filters through my window, a kind text from a friend, the taste of my morning coffee. These moments add up to something beautiful." },
    { title: "Challenging Day", content: "Today felt overwhelming with everything on my plate. But I'm learning that it's okay to feel stressed sometimes. What matters is how I respond and take care of myself through it." },
    { title: "Creative Breakthrough", content: "Had an amazing moment of clarity on a project I've been working on. Sometimes the best ideas come when I stop forcing them and just let my mind wander naturally." },
    { title: "Connection and Community", content: "Spent time with people who truly understand me today. There's something so nourishing about being seen and accepted exactly as you are. Feeling grateful for these relationships." },
    { title: "Learning Journey", content: "Reading about something completely new today opened my mind to different perspectives. I love how learning can shift the way I see the world and myself." },
    { title: "Nature Therapy", content: "Took a long walk outside and felt my stress melt away. Being in nature always reminds me of what's truly important and helps me find my center again." },
    { title: "Evening Gratitude", content: "Ending the day by reflecting on what went well. Even on difficult days, there are usually small victories worth celebrating." }
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
    const selectedTopic = topics[topicIndex];
    
    // Generate 1-3 random tags
    const entryTags = [];
    const numTags = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numTags; j++) {
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      if (!entryTags.includes(randomTag)) {
        entryTags.push(randomTag);
      }
    }
    
    // Generate mood based on content sentiment
    let mood = 3;
    if (selectedTopic.title.includes("Gratitude") || selectedTopic.title.includes("Creative") || selectedTopic.title.includes("Nature")) {
      mood = Math.floor(Math.random() * 2) + 4; // 4-5
    } else if (selectedTopic.title.includes("Challenging")) {
      mood = Math.floor(Math.random() * 2) + 2; // 2-3
    } else {
      mood = Math.floor(Math.random() * 3) + 3; // 3-5
    }
    
    demoData.push({
      id: `demo-diary-${i}-${Date.now()}`,
      title: selectedTopic.title,
      content: selectedTopic.content,
      mood: mood,
      tags: entryTags,
      timestamp: entryDate
    });
  }
  
  return demoData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};