import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Star, Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookDetails {
  id: string;
  title: string;
  authors: string[];
  description: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  publishedDate?: string;
  pageCount?: number;
}

interface Book {
  id: string;
  volumeInfo: BookDetails;
}

const BookRecommender = () => {
  const [inputBook, setInputBook] = useState('');
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const { toast } = useToast();

  const getBookRecommendations = async (bookName: string) => {
    setLoading(true);
    
    try {
      // First, search for the input book to get its details
      const inputBookResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookName)}&maxResults=1`
      );
      const inputBookData = await inputBookResponse.json();
      
      if (!inputBookData.items || inputBookData.items.length === 0) {
        throw new Error('Book not found');
      }

      const inputBookInfo = inputBookData.items[0].volumeInfo;
      const genre = inputBookInfo.categories?.[0] || 'fiction';
      const author = inputBookInfo.authors?.[0] || '';

      // Get recommendations based on genre and similar authors
      const genreQuery = `subject:${genre}`;
      const authorQuery = author ? `inauthor:${author}` : '';
      
      // Combine different search strategies for better recommendations
      const queries = [
        genreQuery,
        authorQuery,
        `subject:${genre} bestseller`,
        `subject:${genre} popular`,
        'bestseller fiction'
      ].filter(Boolean);

      const allBooks: Book[] = [];
      
      for (const query of queries) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&orderBy=relevance`
          );
          const data = await response.json();
          
          if (data.items) {
            allBooks.push(...data.items);
          }
        } catch (error) {
          console.log(`Error with query ${query}:`, error);
        }
      }

      // Filter out the input book and duplicates, then select 5 recommendations
      const filteredBooks = allBooks.filter((book, index, self) => {
        const isNotInputBook = book.volumeInfo.title.toLowerCase() !== bookName.toLowerCase();
        const isUnique = self.findIndex(b => b.id === book.id) === index;
        const hasImage = book.volumeInfo.imageLinks?.thumbnail;
        return isNotInputBook && isUnique && hasImage;
      });

      const selectedRecommendations = filteredBooks.slice(0, 5);
      setRecommendations(selectedRecommendations);

      if (selectedRecommendations.length === 0) {
        toast({
          title: "No recommendations found",
          description: "Try searching for a different book.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Recommendations found!",
          description: `Found ${selectedRecommendations.length} book recommendations for you.`,
        });
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch book recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputBook.trim()) {
      getBookRecommendations(inputBook.trim());
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      setContactForm({ name: '', email: '', message: '' });
      setContactLoading(false);
    }, 1000);
  };

  const handleContactInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Book <span className="text-primary">Whisperer</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover your next literary adventure. Enter a book you love, and let our intelligent system 
            recommend five carefully curated titles that will captivate your imagination.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-playfair">Find Your Next Great Read</CardTitle>
              <CardDescription className="text-base">
                Enter the title of a book you enjoyed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="e.g., Harry Potter, The Great Gatsby, Dune..."
                    value={inputBook}
                    onChange={(e) => setInputBook(e.target.value)}
                    className="pl-12 py-6 text-lg border-2 focus:border-primary/50 transition-all duration-300"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !inputBook.trim()}
                  className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Finding Recommendations...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Get Recommendations</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-foreground font-playfair">
                Recommended for <span className="text-primary">You</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Based on your interest in "{inputBook}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {recommendations.map((book, index) => (
                <Card 
                  key={book.id} 
                  className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-0 bg-card/90 backdrop-blur-sm overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={book.volumeInfo.imageLinks?.thumbnail || '/placeholder.svg'}
                      alt={book.volumeInfo.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {book.volumeInfo.averageRating && (
                      <div className="absolute top-3 right-3 bg-accent/90 text-accent-foreground px-2 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{book.volumeInfo.averageRating}</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {book.volumeInfo.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      by {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                    </p>
                    {book.volumeInfo.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {truncateText(book.volumeInfo.description.replace(/<[^>]*>/g, ''), 100)}
                      </p>
                    )}
                    <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
                      {book.volumeInfo.publishedDate && (
                        <span>{new Date(book.volumeInfo.publishedDate).getFullYear()}</span>
                      )}
                      {book.volumeInfo.pageCount && (
                        <span>{book.volumeInfo.pageCount} pages</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground font-playfair">
              Get in <span className="text-primary">Touch</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about our recommendations? Want to suggest improvements? 
              We'd love to hear from you!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-playfair">Contact Information</CardTitle>
                  <CardDescription>
                    Reach out to us through any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-muted-foreground">hello@bookwhisperer.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-muted-foreground">
                        123 Literary Lane<br />
                        Book City, BC 12345
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Office Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-playfair">Send us a Message</CardTitle>
                <CardDescription>
                  We'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={contactForm.name}
                        onChange={(e) => handleContactInputChange('name', e.target.value)}
                        required
                        className="transition-all duration-300 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={contactForm.email}
                        onChange={(e) => handleContactInputChange('email', e.target.value)}
                        required
                        className="transition-all duration-300 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your question, suggestion, or feedback..."
                      value={contactForm.message}
                      onChange={(e) => handleContactInputChange('message', e.target.value)}
                      required
                      rows={5}
                      className="transition-all duration-300 focus:border-primary/50 resize-none"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={contactLoading || !contactForm.name || !contactForm.email || !contactForm.message}
                    className="w-full py-3 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {contactLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <h3 className="text-2xl font-bold mb-4 font-playfair">About Book Whisperer</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our intelligent recommendation system analyzes genres, authors, and reader preferences 
                to curate personalized book suggestions. Discover new worlds, explore different perspectives, 
                and find your next favorite read with the power of literary intelligence.
              </p>
              <div className="text-sm text-muted-foreground border-t border-border/50 pt-4">
                <p>&copy; 2024 Book Whisperer. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BookRecommender;
