// Demo data generator for testing mood trends
export const generateDemoMoodData = () => {
  
  for (let i = 20; i >= 0
  
    const entriesPerDay = Math.floor(Math
    for (let j = 0; j < entriesPe
      entryTime.setHours(Math.floor(Math.random() * 16) + 6); // 6 AM
    
    // Add 1-3 entries per day with varied timing
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < entriesPerDay; j++) {
      const entryTime = new Date(date);
      entryTime.setHours(Math.floor(Math.random() * 16) + 6); // 6 AM to 10 PM
      entryTime.setMinutes(Math.floor(Math.random() * 60));
      
      
      const trendFactor
      
      
        id: `demo-mood-${entryTime.getTime()}-${j}`,
      
    }
  
};
export const generateDemoDiaryData
    { 
    { title: "Evening Gratitude", content: 
    { title: "Learning Journey", content: "Readin
    { 
  ];
  const tags = ["gratitude", "growth"
  const demoData = [];
  
  const numEntries = Math.floor(Math.random()
  for (let i = 0; i < numEntries; i++) {
    const entryDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 *
    
    const topic = topics[topicIndex];
    //
    const selectedTag
      const tagIndex = Math.floor(Math.random() * ta
        selectedTags
    }
    // Mo
    
   
  
      tags: selectedTags,
  

};











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