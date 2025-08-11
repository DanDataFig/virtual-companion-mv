// Demo data generator for testing mood trends

  const demoData = [];
  // Generate mood entrie
    const date = new D
  
    
      const entryTime = new Date
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    // Random number of entries per day (1-3)
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < entriesPerDay; j++) {
      const entryTime = new Date(date);
      entryTime.setHours(Math.floor(Math.random() * 16) + 6); // 6 AM to 10 PM
      
    
      let mood = 3; // Start neutral
      
      
      if (date.getDay() === 0 || date.getDay() === 6) {
        level: mood,
      }
      
      // Random variation
  return demoData.sort((a, b) => b.times
      
export const generateDemoDi
      mood = Math.max(1, Math.min(5, Math.round(mood)));
    { 
      demoData.push({
    { title: "Connection and Community", content
        level: mood,
        timestamp: entryTime
      });
  con
  }
  
  return demoData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  

    const daysAgo = Math.floor(Math.random()
  const topics = [
    { title: "Morning Reflection", content: "Started the day with some quiet time to myself. There's something peaceful about the early morning hours that helps me center my thoughts and set intentions for the day ahead." },
    { title: "Gratitude Practice", content: "Taking time to appreciate the small things today. The way sunlight filters through my window, a kind text from a friend, the taste of my morning coffee. These moments add up to something beautiful." },
    { title: "Challenging Day", content: "Today felt overwhelming with everything on my plate. But I'm learning that it's okay to feel stressed sometimes. What matters is how I respond and take care of myself through it." },
    { title: "Creative Breakthrough", content: "Had an amazing moment of clarity on a project I've been working on. Sometimes the best ideas come when I stop forcing them and just let my mind wander naturally." },
      tags: entryTags,
    });
  
};

  


































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