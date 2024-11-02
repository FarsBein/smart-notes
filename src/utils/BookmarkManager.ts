export default class BookmarkManager {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.RAINDROP_API_KEY as string;
    this.apiUrl = 'https://api.raindrop.io/rest/v1';
  }

  /**
   * Fetch all bookmarks for the user.
   * @returns Promise containing the list of bookmarks.
   */
  async getBookmarks(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/raindrops/0`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }

  /**
   * Add a new bookmark.
   * @param title The title of the bookmark.
   * @param link The URL of the bookmark.
   * @returns Promise containing the added bookmark.
   */
  async addBookmark(title: string, link: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/raindrop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          link,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return null;
    }
  }

  /**
   * Remove a bookmark by its ID.
   * @param id The ID of the bookmark to remove.
   * @returns Promise indicating success or failure.
   */
  async removeBookmark(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/raindrop/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  }
}