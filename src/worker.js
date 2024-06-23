
// Export a default object containing event handlers
export default {
  async fetch(request, env, ctx) {

    let response = await fetch("https://api.sr.se/api/v2/episodes/index?programid=2071&fromdate=2023-01-01&todate=2024-12-31&audioquality=hi&format=json", {
      method: "GET",
      cf: {
        // Always cache this fetch regardless of content type
        // for a max of 1h before revalidating the resource
        cacheTtl: 3600,
        cacheEverything: true,
      },
    });
    const json = await response.json();

    const xml = generateRssXml(json);


    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        "Cache-Control": "max-age=3600"
      },
    });
  },
};

function generateRssXml(data) {
  const items = data.episodes.map(episode => {

    const title = encodeHtmlEntities(episode.title)
    const description = encodeHtmlEntities(episode.description)

    return `
    <item>
      <title>${title}</title>
      <description>${description}</description>
      <duration>${episode.listenpodfile.duration}</duration>
      <itunes:duration>${episode.listenpodfile.duration}</itunes:duration>
      <pubDate>${convertToDate(episode.publishdateutc).toUTCString()}</pubDate>
      <enclosure url="${episode.listenpodfile.url}" type="audio/mpeg" />
      <guid isPermaLink="false">${episode.id}</guid>
    </item>
  `}).join('');

  const title = encodeHtmlEntities("Sommar & Vinter i P1");
  const category = encodeHtmlEntities("Society & Culture");

  return `
  <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0" xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sr="http://www.sverigesradio.se/podrss" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
  <channel>
  <itunes:new-feed-url>https://api.sr.se/api/rss/pod/itunes/4023</itunes:new-feed-url>
    <atom:link href="https://api.sr.se/api/rss/pod/itunes/4023" rel="self" type="application/rss+xml"/>
    <lastBuildDate>Sun, 23 Jun 2024 09:05:48 GMT</lastBuildDate>
    <image>
        <title>${title}</title>
        <link>https://sverigesradio.se/sommarip1</link>
        <url>
            https://static-cdn.sr.se/images/2071/5b005202-e1f8-4104-a7d5-9769653effa6.jpg?preset=api-itunes-presentation-image
        </url>
    </image>
    <itunes:image href="https://static-cdn.sr.se/images/2071/5b005202-e1f8-4104-a7d5-9769653effa6.jpg?preset=api-itunes-presentation-image"/>
    <itunes:explicit>no</itunes:explicit>
    <itunes:summary>
        <![CDATA[Personliga berättelser som definierar vår tid. Alla Sommarprat finns att lyssna på i Sveriges Radio Play. Ansvarig utgivare: Karin Lindblom]]>
    </itunes:summary>
    <itunes:author>Sveriges Radio</itunes:author>
    <itunes:category text="${category}"/>
    <itunes:owner>
        <itunes:name>${title}</itunes:name>
        <itunes:email>podd@sverigesradio.se</itunes:email>
    </itunes:owner>
    <title>${title}</title>
    <link>https://sverigesradio.se/sommarip1</link>
    <description>
        <![CDATA[ Personliga berättelser som definierar vår tid. <a href="https://sverigesradio.se/play/program/2071?utm_source=thirdparty&utm_medium=rss&utm_campaign=program_sommarip1">Alla Sommarprat finns att lyssna på i Sveriges Radio Play.</a> Ansvarig utgivare: Karin Lindblom ]]>
    </description>
    <language>sv</language>
    <copyright>Copyright Sveriges Radio 2024. All rights reserved.</copyright>
    ${items}
    </channel>
    </rss>
  `;
}

function convertToDate(dateString) {
  // Use a regular expression to extract the timestamp
  const timestampMatch = /\/Date\((\d+)\)\//.exec(dateString);

  if (timestampMatch) {
    const timestamp = parseInt(timestampMatch[1], 10);
    return new Date(timestamp);
  } else {
    return new Date()
  }
}

const htmlEntitiesMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function encodeHtmlEntities(str) {
  return str.replace(/[&<>"']/g, (char) => htmlEntitiesMap[char] || char);
}
