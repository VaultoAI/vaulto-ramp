import { useState, useEffect, useCallback } from 'react';

const CACHE_DURATION = 60000; // 60 seconds
const FALLBACK_PRICE = 2000; // Fallback price if API fails

/**
 * Fetches ETH price from CoinGecko as a fallback (no API key required)
 */
const fetchFromCoinGecko = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.ethereum?.usd) {
      return parseFloat(data.ethereum.usd.toString());
    }
    
    throw new Error('Invalid CoinGecko response structure');
  } catch (err) {
    console.error('Error fetching from CoinGecko:', err);
    throw err;
  }
};

interface PriceCache {
  price: number;
  timestamp: number;
}

let priceCache: PriceCache | null = null;

export const useEthPrice = () => {
  const [price, setPrice] = useState<number>(FALLBACK_PRICE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEthPrice = useCallback(async () => {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      setPrice(priceCache.price);
      setIsLoading(false);
      return;
    }

    const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    
    if (!apiKey) {
      console.warn('ETHERSCAN_API_KEY not found in environment variables. Using fallback price.');
      setPrice(FALLBACK_PRICE);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Log response for debugging (only in development)
      if (import.meta.env.DEV) {
        console.log('Etherscan API response:', data);
      }

      // Check if API returned an error
      if (data.status === '0' || data.message !== 'OK') {
        throw new Error(data.message || 'Etherscan API error');
      }

      // Verify response structure
      if (!data.result || typeof data.result.ethusd === 'undefined') {
        throw new Error('Invalid API response structure');
      }

      const ethPrice = parseFloat(data.result.ethusd);
      
      if (isNaN(ethPrice) || ethPrice <= 0) {
        throw new Error(`Invalid price value: ${data.result.ethusd}`);
      }

      // Update cache
      priceCache = {
        price: ethPrice,
        timestamp: Date.now(),
      };

      setPrice(ethPrice);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching ETH price from Etherscan:', errorMessage, err);
      
      // Try CoinGecko as fallback if Etherscan fails
      try {
        console.log('Attempting to fetch ETH price from CoinGecko as fallback...');
        const coinGeckoPrice = await fetchFromCoinGecko();
        
        if (!isNaN(coinGeckoPrice) && coinGeckoPrice > 0) {
          // Update cache with CoinGecko price
          priceCache = {
            price: coinGeckoPrice,
            timestamp: Date.now(),
          };
          setPrice(coinGeckoPrice);
          setError(null);
          console.log('Successfully fetched ETH price from CoinGecko:', coinGeckoPrice);
          return;
        }
      } catch (coinGeckoErr) {
        console.error('CoinGecko fallback also failed:', coinGeckoErr);
      }
      
      // Use cached price if available, otherwise use fallback
      if (priceCache) {
        console.warn('Using cached ETH price due to API errors');
        setPrice(priceCache.price);
        setError(`Using cached price. Last fetch error: ${errorMessage}`);
      } else {
        console.warn('Using fallback ETH price due to API errors');
        setPrice(FALLBACK_PRICE);
        setError(`Using fallback price. Fetch error: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEthPrice();
    
    // Set up interval to refresh price every cache duration
    const interval = setInterval(fetchEthPrice, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [fetchEthPrice]);

  return { price, isLoading, error, refetch: fetchEthPrice };
};

